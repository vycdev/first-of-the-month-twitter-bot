import "dotenv/config"

import TwitterApi from "twitter-api-v2"

import fs from "fs"

import koa from "koa"
import Router from "koa-router"
import logger from "koa-logger"
import bodyParser from "koa-bodyparser"

import { errorHandler } from "./error/errorHandler"

const port = Number(process.env.PORT || 5000)
const app = new koa();
const router = new Router();

const twitterClient = new TwitterApi({
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || ""
})

const callbackURL = "http://127.0.0.1:5000/callback"

router.get("/", async (ctx, next) => {
    ctx.status = 200;
    ctx.body = {
        message: `Welcome to the app, to be redirected to the OAuth request link go to ${ctx.href}oauth`
    }
    await next();
})


router.get("/oauth", async (ctx, next) => {
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(callbackURL, { scope: ['tweet.write', 'offline.access'] })

    console.log(url, codeVerifier, state);

    const data = { codeVerifier, state }

    fs.writeFileSync("data.json", JSON.stringify(data));

    ctx.redirect(url);
    await next();
})

router.get("/callback", async (ctx, next) => {
    console.log(ctx.query.state, ctx.query.code);

    const state = String(ctx.query.state)
    const code = String(ctx.query.code)

    const storedData = await JSON.parse(fs.readFileSync("data.json", "utf-8"))
    if (!storedData.codeVerifier || !storedData.state || !state || !code) {
        ctx.status = 400;
        ctx.body = { message: "Bad request." }
    }

    if (state !== storedData.state) {
        ctx.status = 400;
        ctx.body = { message: "Bad request." }
    }

    const { client: loggedClient, accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
        code,
        codeVerifier: storedData.codeVerifier,
        redirectUri: callbackURL,
    });

    const data = { codeVerifier: storedData.codeVerifier, accessToken, refreshToken, state }

    fs.writeFileSync("data.json", JSON.stringify(data));

    ctx.status = 200;
    ctx.body = {
        message: "The params have been saved."
    }

    await next();
})

app.use(errorHandler())
app.use(bodyParser())
app.use(logger())
app.use(router.routes()).use(router.allowedMethods())

app.listen(port, () => {
    console.info(`Koa app started and listening to port ${port}! 🚀`);
})

//state=svkgXCJ32la-Cp2jiXPi6.Dx7C.n5ha8&
//code=V0ttN0JaU0FsYUJoM1pLek1aZlZ4SnQ4cy14SzJxN3lJX2dJaktZczJhdzA4OjE2NjA3NDQ1NzA3MzY6MToxOmFjOjE
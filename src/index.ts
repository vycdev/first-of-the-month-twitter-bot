import "dotenv/config"
import TwitterApi from "twitter-api-v2"

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

router.get("/", async (ctx, next) => {
    ctx.status = 200;
    ctx.body = {
        message: `Welcome to the app, to be redirected to the OAuth request link go to ${ctx.href}oauth`
    }
    await next();
})

const callbackURL = "http://127.0.0.1:5000/callback"

router.get("/oauth", async (ctx, next) => {
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(callbackURL, { scope: ['tweet.write', 'offline.access'] })

    console.log(url, codeVerifier, state);

    ctx.redirect(url);
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
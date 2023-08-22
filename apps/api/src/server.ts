import app from "./app"

// app.startBots().catch(err => console.log(err))

app.app.listen(process.env.PORT, () => {
    console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
})

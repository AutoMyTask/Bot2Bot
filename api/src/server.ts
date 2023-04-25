import app from "./app"
import {start} from "../bots";

start().catch(err => console.log(err))

app.listen(process.env.PORT, () => {
    console.log('Server started on port 3000')
})

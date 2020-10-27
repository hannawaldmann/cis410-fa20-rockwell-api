const express = require('express')

const app = express();

app.get("/hi", (request,response)=>{
response.send("hello world")
})



app.listen(5000,()=>{console.log("app is running on port 5000")})

//http://localhost:5000/hi
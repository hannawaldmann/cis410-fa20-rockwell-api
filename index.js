const express = require('express')
const db = require('./dbConnectExec.js')

const app = express();

//http://localhost:5000/hi
app.get("/hi", (req,res)=>{
response.send("hello world")
})

//http://localhost:5000/movies
app.get("/movies", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT *
    //     FROM Movie
    //     LEFT JOIN Genre 
    //     ON Genre.GenrePK = Movie.GenreFK`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})

app.get("/movies/:pk", (req,res)=>{
    var pk = req.params.pk
    // console.log("my PK:" + pk)

    var myQuery = `SELECT *
    FROM Movie
    LEFT JOIN Genre
    ON Genre.GenrePK = Movie.GenreFK
    WHERE MoviePK = ${pk}`

    db.executeQuery(myQuery)
    .then((movies)=>{
        // console.log("Movies: " + movies)
        if(movies[0]){
            res.send(movies[0])
        }else{
            res.status(404).send('bad request')
        }
    })
    .catch((err)=>{
        console.log("Error in /movies/pk",err)
        res.status(500).send()
    })
})
app.listen(5000,()=>{console.log("app is running on port 5000")})


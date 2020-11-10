const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const db = require('./dbConnectExec.js');
const config = require('./config.js')
const auth = require(("./middleware/authenticate"))

const { response } = require('express');
const dbConnectExec = require('./dbConnectExec.js');

const app = express();

app.use(express.json())

app.post("/reviews", auth, async (req,res)=>{

    try{
    var movieFK = req.body.movieFK
    var summary = req.body.summary;
    var rating = req.body.rating;

    if(!movieFK || !summary || !rating){res.status(400).send("bad request")}

    summary = summary.replace("'","''")

    // console.log("here is the contact in /reviews", req.contact)
    // res.send("here is your response")

    let insertQuery = `INSERT INTO Review(Summary, Rating, MovieFK, ContactFK)
    OUTPUT inserted.ReviewPK, inserted.Summary, inserted.Rating, inserted.MovieFK
    VALUES('${summary}', '${rating}', '${movieFK}', ${req.contact.ContacktPK})`

    let insertedReview = await db.executeQuery(insertQuery)
// console.log(insertedReview)
    res.status(201).send(insertedReview[0])
}

    catch(error){
        console.log("error in POST /review", error)
        res.status(500).send()
    }
})

app.get('/contacts/me', auth, (req,res)=>{
    res.send(req.contact)
})

//http://localhost:5000/hi
app.get("/hi", (req,res)=>{
response.send("hello world")
})

app.post("/contacts/login", async (req, res)=>{
// console.log(req.body)

var email= req.body.email;
var password = req.body.password;

if(!email || !password){
    return res.status(400).send('bad request')
}

//1. check that user email exists in db
var query = `SELECT *
FROM Contact
WHERE Email = '${email}'`

// var result = await db.executeQuery(query);
let result;

try{
    result = await db.executeQuery(query);
}catch(myError){
    console.log('error in /cotacts/login:', myError);
    return res.status(500).send()
}

// console.log(result)

if(!result[0]){return res.status(400).send('invalid user credentials')}

//2. check that their password matches

let user = result[0]
// console.log(user)

if(!bcrypt.compareSync(password, user.Password)){
    console.log("invalid password")
    return res.status(400).send("Invalid user credentials")
}

//3. generate a token

let token = jwt.sign({pk: user.ContactPK}, config.JWT, {expiresIn: '60 minutes'})
// console.log(token)

//4. save token in db and send token and user info back to user
let setTokenQuery = `UPDATE Contact
SET Token = '${token}'
WHERE ContactPK = ${user.ContactPK}`

try{
await db.executeQuery(setTokenQuery)

res.status(200).send({
    token: token, 
    user: {
        NameFirst: user.NameFirst,
        NameLast: user.NameLast,
        Email: user.Email,
        ContactPK: user.ContactPK
    }
})
}
catch(myError){
    console.log("Error setting user token ", myError);
    res.status(500).send()
}

})

app.post("/contacts", async(req,res)=>{
    // res.send("creating user")
    console.log("request body", req.body)

    var nameFirst = req.body.nameFirst;
    var nameLast = req.body.nameLast;
    var email = req.body.email;
    var password = req.body.password;

    if(!nameFirst || !nameLast || !email || !password){
        return res.status(400).send("bad request")
    }

    nameFirst = nameFirst.replace("'", "''")
    nameLast = nameLast.replace("'", "''")

    var emailCheckQuery = `SELECT email
    FROM contact
    WHERE email ='${email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)

    // console.log("existing user", existingUser)

    if(existingUser[0]){
        return res.status(409).send("Please enter a different email.")
    }

    var hashedPassword = bcrypt.hashSync(password)
    var insertQuery = `INSERT INTO contact(NameFirst, NameLast, Email, Password)
    VALUES('${nameFirst}', '${nameLast}', '${email}', '${hashedPassword}')`
    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("error in POST /contacts", err)
        res.status(500).send()
    })
})

//http://localhost:5000/movies
app.get("/movies", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT *
         FROM Movie
         LEFT JOIN Genre 
         ON Genre.GenrePK = Movie.GenreFK`)
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


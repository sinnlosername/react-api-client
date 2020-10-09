const express = require('express')
const app = express()

app.use((req, res) => {
  res.header("Access-Control-Allow-Origin", req.header("origin"));
  res.header("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE")
  res.header("Access-Control-Allow-Credentials", "true")
})

app.get('/', (req, res) => {
  res.send({
    test: 1
  })
})

app.listen(3001, () => {
  console.log("Ready!")
})

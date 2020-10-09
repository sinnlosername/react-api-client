const express = require('express')
const app = express()

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.header("origin"));
  res.header("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE")
  res.header("Access-Control-Allow-Credentials", "true")
  next();
});

["get", "post", "put", "patch", "delete"].forEach(method => {
  app[method](`/okay`, (req, res) => res.send({status: "success", date: new Date().toString()}));
  app[method](`/error`, (req, res) => res.send({status: "error", date: new Date().toString()}));
})

app.listen(3001, () => {
  console.log("Ready!")
})

const express = require("express");
const router = express.Router();
const getNetflixTickets = require("../controllers/netflixGetAllController.js");



router.post("/postticketsdata", getNetflixTickets.postticketsdata);                   
router.post("/qmdata", getNetflixTickets.qmdata);                   


router.get("/getNetflixTickets", getNetflixTickets.getNetflixTickets);                   

module.exports =  router
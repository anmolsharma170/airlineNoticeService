const express = require('express');
const {ServerConfig, Logger} = require('./config');
const apiRoutes = require('./routes');

const mailsender = require('./config/email-config');
const serverConfig = require('./config/server-config');
const app = express(); 
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use('/api',apiRoutes);
app.listen(ServerConfig.PORT,async ()=>{
    console.log(`Successfully started the server on PORT: ${ServerConfig.PORT}`);
    try {
        const response = await mailsender.sendMail({
        from:serverConfig.GMAIL_EMAIL,
        to:'astommartinmartin123@gmail.com',
        subject: 'Is the service working?',
        text: 'yes it is working'
    });
    console.log(response);
    } catch (error) {
        console.log(error);
    }
});

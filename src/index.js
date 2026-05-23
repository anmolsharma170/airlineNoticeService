const express = require('express');
const amqplib = require("amqplib");
const {EmailService} = require('./services');
async function connectQueue(){
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue("noti-queue");
        channel.consume("noti-queue",async (data)=>{
            const payload = Buffer.from(data.content).toString();
            console.log(payload);
            try {
                const object = JSON.parse(payload);
                await EmailService.sendEmail("rohit12315400@gmail.com", object.recepientEmail, object.subject, object.text);
                channel.ack(data);
            } catch (error) {
                console.error("Failed to parse JSON or send email:", error.message);
                // Acknowledge the message anyway to remove it from the queue, 
                // or use channel.nack(data, false, false) to discard it.
                channel.ack(data);
            }
        })
    } catch (error) {
        console.log(error);
        throw error;
    }
}

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
    await connectQueue();
    console.log("queue connected successfully");
});

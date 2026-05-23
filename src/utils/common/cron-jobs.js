const cron  = require('node-cron');
const { BookingService } = require('../../services');

function scheduleCrons(){
    cron.schedule('*/30 * * * *',async ()=>{ //this cron will vanish every pending bookings from last 30minutes
    const response = await BookingService.canceloldBookings();
    })
}
module.exports=scheduleCrons;

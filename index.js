const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000

//middle ware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jbxtt4r.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingCollection = client.db('doctorsPortal').collection('bookings');

        app.get('/appointmentOptions' , async(req , res)=>{
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = {appointmentDate: date}
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
            // console.log(alreadyBooked);

            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
                // console.log(remainingSlots.length);
            })
            res.send(options);
        })

        app.get('/bookings' , async(req , res)=>{
           const email = req.query.email
           const query = {
               email: email 
           } 
           const bookings = await bookingCollection.find(query).toArray()
           res.send(bookings);
        })

        app.post('/bookings' , async(req , res)=>{            
           const booking = req.body;

           const query = {
               appointmentDate: booking.appointmentDate,
               email: booking.email,
               treatment: booking.treatment  
           }

           const alreadyBooked = await bookingCollection.find(query).toArray();

           if(alreadyBooked.length){
               const message = `You already have a booking on ${booking.appointmentDate}`
               return res.send({acknowledge: false, message}) 
           }

           const result = await bookingCollection.insertOne(booking); 
           res.send(result); 
        })


    }
    finally{

    }
}
run().catch(err => console.error(err))



app.get('/' , (req , res)=>{
   res.send('doctors portal server is running :)')
})

app.listen(port , ()=> console.log('> doctors portal server running on port : ' + port))
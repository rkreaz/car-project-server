const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');

const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));

app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j9zzvlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const carProjectCollection = client.db('carProject').collection('services');
        const bookingCollection = client.db('carProject').collection('booking');

        // jwt API server;

        app.post('/jwt', async(req, res) => {
               const user = req.body;
               const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
               res
               .cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'none'
               })
               .send({success: true})
        })




        app.get('/services', async (req, res) => {
            const cursor = carProjectCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/checkout/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, img: 1, price: 1, service_id: 1 },
            };

            const result = await carProjectCollection.findOne(query, options);
            res.send(result);
        })

        // booking section server   

        app.get('/booking', async (req, res) => {
            console.log(req.query.email);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)

        })
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bookingConform = req.body;
            const updateDoc = {
                $set: {
                    status: bookingConform.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result)

        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Car Project Is Running');
})

app.listen(port, () => {
    console.log(`Car Project Server on Running ${port}`);
})
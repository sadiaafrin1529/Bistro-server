const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ovk24.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("bistroDB").collection("users");
    const menuCollection = client.db("bistroDB").collection("menu");
    const reviewsCollection = client.db("bistroDB").collection("reviews");
    const cartsCollection = client.db("bistroDB").collection("carts");

    //jwt
    //tokhn banabo
    app.post('/jwt', async (req, res) => {
      //playload
      const user = req.body;//post jekhan theke dibo se khan theke user ba kono ekta information ashbe seta amra req.body theke nibo
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });//token eta
      res.send({token})
      //res.send({tokenn:token})//name hobe {token:token} value hobe token^(mane uporer er token ta)
    })

    //middleware for vertify token
    const verifyToken = (req, res, next) => {
      console.log("inside verifytoken", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({message:"Forbidden access"})
      }
      const token = req.headers.authorization.split(' ')[1];
      next();
    }

    app.get("/users",verifyToken, async (req, res) => {
      // console.log(req.headers)
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    app.post("/users", async (req, res) => {
      const user = req.body;
      //insert email if user doesn't exist
      //we can do this many way(1.email unique 2.upsert 3.simple checking)
      //3
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
      return res.send({ message: " User Already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
})

    app.patch("/users/admin/:id", async (req, res) => {
      //id ta k admin korbo
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    
    
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    
    
    
    
    
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
    });

    const { ObjectId } = require("mongodb");
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bistro Boss running...");
});

app.listen(port, () => {
  console.log(`Bistro Boss running on port ${port}`);
});

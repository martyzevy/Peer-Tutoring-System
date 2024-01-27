const express = require('express');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb'); 


const cors = require('cors');
const bcrypt = require('bcrypt');

//const twilio = require('twilio');

const accountSid = 'ACfff2d59ea6011772def73d088e7e50f3'; // Replace with your Twilio account SID
const authToken = 'c9106b39e8c9a9f1085d07ee9e38baf5'; // Replace with your Twilio auth token

//const twiloClient = new twilio(accountSid, authToken);



// MongoDB Atlas connection string
const uri = "mongodb+srv://marty:tPrJmOdSW2Mhsc8O@cluster0.aalzlsk.mongodb.net";

const client = new MongoClient(uri);
const app = express();
const port = process.env.PORT || 3000; // Use the provided port by Heroku or default to 3000 for local development

// ...




app.use(cors());
app.use(express.json());



async function startServer() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB Atlas");
        defineRoutes();

        // Define the root route
        
        
        
        


        // Start the Express server
        app.listen(port, () => {
            //console.log(`Server running at http://localhost:${port}`);
        });


    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }

    app.get('/', (req, res) => {
        res.send('Welcome to the AP On-Demand Tutor Service!');
    });
}


function defineRoutes() {

    app.post('/send-notification/:userPhone', async (req, res) => {
        try {
            const phone = req.params.userPhone;
            console.log(phone);
    
            /*const message = await twiloClient.messages.create({
                body: 'Hello from Twilio',
                from: '+18336595370',
                to: '2065729714'
            });
    
            console.log(message.sid);*/
            res.json({ message: 'Notification sent successfully' });
        } catch (error) {
            console.error('Error sending notification:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    

   

    app.get('/get-tutor/:id', async (req, res) => {
        const tutorId = new ObjectId(req.params.id);
        const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
        const query = { _id: tutorId};
        const tutor = await tutorsCollection.findOne(query);
        console.log("id =", tutorId, " tutor =", tutor);
        if (!tutor) return res.status(400).json({ error: 'Invalid Tutor ID' });
        res.status(200).json({online: tutor._available});
    });


    app.post('/signup', async (req, res) => {
        try {
            const { name, email, phone, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    
            const clientsCollection = client.db("AP-Tutoring").collection("Clients");
            // Check if email already exists
            const existingClient = await clientsCollection.findOne({ email });
            if (existingClient) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            console.log("testing");
            // Insert new client
            await clientsCollection.insertOne({
                name,
                email,
                phone,
                password: hashedPassword
            });

            const newClient = await clientsCollection.findOne({ email });
    
            res.status(201).json({ message: 'Signup successful', person: newClient });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error during signup: " + err.message });
        }
    });
    
    // Login endpoint
    app.post('/login', async (req, res) => {
        try {
            
            const { email, password } = req.body;
            console.log(email, password);
            const clientsCollection = client.db("AP-Tutoring").collection("Clients");
            const user = await clientsCollection.findOne({ email: email });
    
            if (user && await bcrypt.compare(password, user.password)) {
                res.status(200).json({ message: 'Login successful', person: user });
            } else {
                res.status(400).json({ error: 'Invalid credentials' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error during login: " + err.message });
        }
    });

    // Define the /find-tutor/:subjectIndex route
    app.get('/find-tutor/:subjectIndex', async (req, res) => {
        try {
            const subjectIndex = parseInt(req.params.subjectIndex, 10);
            if (isNaN(subjectIndex) || subjectIndex < 0 || subjectIndex > 12) {
                return res.status(400).json({ error: 'Invalid subject index' });
            }
    
            const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
            const query = { _available: true, [`_subjects.${subjectIndex}`]: true };
            const tutor = await tutorsCollection.findOne(query);
    
            if (tutor) {
                // Temporarily mark the tutor with an offer
                await tutorsCollection.updateOne({ _id: tutor._id }, { $set: { _offer: true, _offerSubject: subjectIndex } });
                res.status(200).json({ name: tutor._name, zoomID: tutor._zoomID, id: tutor._id });
            } else {
                res.status(404).json({ error: 'No available tutors found for this subject.' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error finding a tutor: " + err.message });
        }
    });

    app.patch('/update-tutor-availability/:tutorId', async (req, res) => {
        try {
            // Extracting the tutorId as a string
            const tutorId = req.params.tutorId; 
            console.log("Extracted ID:", tutorId);
    
            // Ensure that tutorId is just a string, not an ObjectId expression
            if (tutorId.includes("ObjectId")) {
                return res.status(400).json({ message: 'Invalid tutor ID format' });
            }
    
            // Convert string to ObjectId
            const objectId = new ObjectId(tutorId);
            console.log("Converted ObjectId:", objectId);
            
            // Updating the tutor's availability
            const result = await client.db("AP-Tutoring").collection("Tutors")
                        .updateOne({ _id: objectId }, { $set: { _available: false } });
    
            if (result.modifiedCount === 1) {
                res.status(200).json({ message: 'Tutor availability updated successfully'});
            } else {
                res.status(404).json({ message: 'Tutor not found' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error updating tutor availability: " + err.message });
        }
    });       

    app.patch('/toggle-tutor-availability/:tutorId', async (req, res) => {
        try {
            const tutorId = new ObjectId(req.params.tutorId);
    
            const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
    
            // Find the tutor to check their current availability
            const tutor = await tutorsCollection.findOne({ _id: tutorId });
    
            if (tutor) {
                // Toggle the availability
                const newAvailability = !tutor._available;
                await tutorsCollection.updateOne(
                    { _id: tutorId },
                    { $set: { _available: newAvailability } }
                );
    
                res.status(200).json({
                    message: 'Tutor availability updated successfully',
                    available: newAvailability
                });
            } else {
                console.log("marty");
                // Tutor not found
                res.status(404).json({ message: 'Tutor not found' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error updating tutor availability: " + err.message });
        }
    });


    app.post('/create-tutor', async (req, res) => {
        try {
            const { _name, _zoomID, _subjects } = req.body;
            const newTutor = { _name, _zoomID, _subjects, _available: false, _offer: false, _accept: false, _decline: false, _online: false };
    
            const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
            const result = await tutorsCollection.insertOne(newTutor);
    
            res.status(201).json({ tutorId: result.insertedId.toString() });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error creating new tutor: " + err.message });
        }
    });


//3 - TODO
app.get('/check-tutor-pairing/:tutorId', async (req, res) => {
    try {
        const tutorId = new ObjectId(req.params.tutorId);
        const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
        const tutor = await tutorsCollection.findOne({ _id: tutorId });

        if (tutor && tutor._offer) {
            res.status(200).json({ offer: true, subject: tutor._offerSubject});
        } else {
            res.status(200).json({ offer: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error checking tutor pairing: " + err.message });
    }
});



app.get('/check-tutor-accept/:tutorId', async (req, res) => {
    console.log(req.params.tutorId);
    try {
        const tutorId = new ObjectId(req.params.tutorId);
        const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
        const tutor = await tutorsCollection.findOne({ _id: tutorId });

        if (tutor && tutor._accept) {
            res.status(200).json({ accept: true, subject: tutor._offerSubject});
        } else if (tutor) {
            res.status(200).json({ accept: false, decline: true });
        }
       /* if (!tutor) {
            res.status(200).json({ accept: false, decline: true });
        }*/
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error checking tutor pairing: " + err.message });
    }
});



app.patch('/accept-gig/:tutorId', async (req, res) => {
    try {
        const tutorId = new ObjectId(req.params.tutorId);
        const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
        await tutorsCollection.updateOne({ _id: tutorId }, { $set: {_offer: false, _accept: true}} );
        const tutor = await tutorsCollection.findOne({ _id: tutorId });
        res.status(200).json({zoomID: tutor._zoomID});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error accepting gig: " + err.message });
    }
});

app.patch('/decline-gig/:tutorId', async (req, res) => {
    try {
        const tutorId = new ObjectId(req.params.tutorId);
        const tutorsCollection = client.db("AP-Tutoring").collection("Tutors");
        await tutorsCollection.updateOne({ _id: tutorId }, { $set: { _offer: false, _decline: true, _available: false, _online: false } });

        res.status(200).json({ message: 'Gig declined' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error declining gig: " + err.message });
    }
});


// ... other endpoints ...


// ... existing code ...

}
startServer();

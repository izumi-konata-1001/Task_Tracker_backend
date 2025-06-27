const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const indexRouters = require('./routers/index');
app.get('/', (req, res) =>{
    res.send('backend server running')
})

app.use('/api', indexRouters);

const PORT = process.env.PORT || 3000;

async function startServer(){
    try{
        const db = require('./db');
        await db.query('SELECT 1');

        console.log('Database connect successfully');

        app.listen(PORT, () =>{
            console.log(`Server is running on ${PORT}`);
        })
    }catch(error){
        console.error('database connect failed, error:', error);
        process.exit(1);
    }
}

startServer();
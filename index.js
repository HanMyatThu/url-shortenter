const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const yup = require('yup');
const monk = require('monk');
const {nanoid} = require('nanoid');
require('dotenv').config()

const db = monk(process.env.MONGO_URL);
const urls = db.get('urls');
urls.createIndex({ slug : 1}, { unique: true });

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

/**
 * Schema for database
 */
const schema = yup.object().shape({
    slug: yup.string().trim().matches(/[\w\-]/i),
    url: yup.string().trim().url().required()
})

app.get('/url/:id', (req,res) => {
    // TODO: get a  short url by id
})

app.get('/:id', async (req,res) => {
    const { id: slug} = req.params;
    try {
        const url = await urls.findOne({ slug });
        if(url) {
            return res.redirect(url.url);
        }
        res.redirect(`/?error=${slug} not found`);
    } catch(e) {
        res.redirect('/?error=link not found');
    }
})

app.post('/url', async (req,res,next) => {
   let { slug, url} = req.body;
   try {   
        await schema.validate({
            slug,
            url
        })
        if(!slug) {
            slug = nanoid(8);
        } else {
            const existing = await urls.findOne({ slug });
            if(existing) {
                throw new Error('Slug in use');
            }
        }
        slug = slug.toLowerCase(); 
        const newUrl = {
            url,
            slug
        };
        const created = await urls.insert(newUrl);
        res.json(created);
        
   } catch (e) {
     next(e);
   }
})

app.use((error,req,res,next) => {
    if(error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message : error.message,
        stack: process.env.NODE_ENV === 'production' ? "🥮" : error.stack
    });
})

app.listen(port, () => {
    console.log('localhost at localhost:3000');
})
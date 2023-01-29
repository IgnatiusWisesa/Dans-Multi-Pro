const fs = require('fs');
const express = require('express');
const http = require('http');
const fileUpload = require('express-fileupload');
const { body, validationResult, param, check } = require('express-validator');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://12345:12345@mflix.ownbz.mongodb.net/test', { useNewUrlParser: true });
const User = mongoose.model('User', { username: String, password: String });
const axios = require('axios');
const _ = require('lodash');

const { paginate } = require('./helpers/helper');

const PORT = 8008

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({ debug: true }))

const checkRegisteredNumber = async function (number) {
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
}

// post-user
app.post('/post-user', [
    body('username').notEmpty().isString(),
    body('password').notEmpty().isString(),
], async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
        return msg;
    })

    if(!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        })
    }

    const user = new User({ username: req.body.username, password: req.body.password });
    user.save().then(() => console.log('new user added!'));

    return res.status(200).json({ status: true, username: req.body.username, message: 'new user added!' })
})

// login-user
app.post('/login-user', [
    body('username').notEmpty().isString(),
    body('password').notEmpty().isString(),
], async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
        return msg;
    })

    if(!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        })
    }

    try {
        const user = await User.find({
            username: req.body.username,
            password: req.body.password
        });
        console.log('user', user);

        if( user.length ) return res.status(200).json({ status: true, message: 'login success' })
    } catch (error) {
        console.log('err', error)
        return res.status(500).json({
            status: false,
            message: 'error db!'
        })
    }

    return res.status(400).json({ status: true, message: 'login failed' })
})

// jobs
app.get('/jobs', [
    check('description').optional().isString(),
    check('location').optional().isString(),
    check('full_time').optional().isString(),
    check('page').optional()
], async (req, res) => {
    let send_jobs = []
    try {
        const jobs = await axios.get('http://dev3.dansmultipro.co.id/api/recruitment/positions.json');

        if( req.query.description ) {
            for( var i = 0; i < jobs.data.length; i++ ) {
                if (
                        jobs.data[i].description.toLowerCase().includes(req.query.description.toLowerCase())
                        && !send_jobs.find(obj => obj.id === jobs.data[i].id)) {
                    send_jobs.push(jobs.data[i])
                }
            }
        }

        if( req.query.location ) {
            for( var i = 0; i < jobs.data.length; i++ ) {
                if (
                        jobs.data[i].location.toLowerCase().includes(req.query.location.toLowerCase())
                        && !send_jobs.find(obj => obj.id === jobs.data[i].id)) {
                    send_jobs.push(jobs.data[i])
                }
            }
        }

        if( req.query.full_time ) {
            for( var i = 0; i < jobs.data.length; i++ ) {
                if (
                        jobs.data[i].type == 'Full Time'
                        && !send_jobs.find(obj => obj.id === jobs.data[i].id)) {
                    send_jobs.push(jobs.data[i])
                }
            }
        }

        if( _.isEmpty( req.query ) ) {
            send_jobs = jobs.data
        }

        if( req.query.page ) {
            send_jobs = paginate(jobs.data, 2, req.query.page)
        }

        return res.status(200).json({ total_jobs: send_jobs.length, jobs: send_jobs })
    } catch (error) {
        console.log('err', error)
        return res.status(500).json({
            status: false,
            message: 'error db!'
        })
    }
})

// job detail by id
app.get('/job/:id', [
    check('id').optional().isString()
], async (req, res) => {

    try {
        const job = await axios.get(`http://dev3.dansmultipro.co.id/api/recruitment/positions/${req.params['id']}`);

        return res.status(200).json({ job: job.data })
    } catch (error) {
        console.log('err', error)
        return res.status(500).json({
            status: false,
            message: 'error db!'
        })
    }
})

server.listen(PORT, () => {
    console.log(`listening on port - ${PORT}`)
})


const express = require('express');
// const res = require('express/lib/response');
// const { updateOne } = require('../models/User');
const router = express.Router();
// const User = require('../models/User');

// router.get('/', (req,res) => {
//   res.send('We are in the lobby!');
// })

// router.post('/', (req,res) => {
//   res.send('We are in the lobby!');
// })

//GETS BACK ALL THE USERS
router.get('/', async (req,res) => {
   try {
       const users = await User.find();
       res.json(users);
   } catch (error) {
       res.json({message: err});
   }
});

//GET "SPECIFIC" USER
router.get('/specific', (req,res) => {
    res.send('We are on a specific user');
});

router.post('/', async (req,res) => {
    const user = new User({
        // id: req.body.id,
        username: req.body.username,
        player: req.body.player,
        room: req.body.room,
        board: req.body.board,
    });
    try {
      const savedUser = await user.save();
      res.json(savedUser);
    } catch (err) {
        res.json({message: err });
    }
});

//GET SPECIFIC USER
router.get('/:userId', async (req,res) => {
    try {
        const user = await User.findById(req.params.userId);
        res.json(user);
    } catch (err) {
        res.json({message: err})
    } 
})

//Delete a specific user
router.delete('/:userId', async (req,res) => {
    try {
        const removedUser = await User.remove({_id: req.params.userId})
        res.json(removedUser);
     } catch (err) {
        res.json({message: err})    
    }
});

//Update a user
router.patch('/:userId', async (req,res) => {
    try {
        const updateUser = await User.updateOne(
            {_id: req.params.userId }, 
            { $set: { title : req.body.title } }
        );
        res.json(updateUser);
     } catch (err) {
        res.json({message: err})    
    }
});

module.exports = router;
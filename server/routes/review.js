import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import isAdminMiddleware from '../middleware/isAdmin.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();



router.post('/submitRequest/:id',authMiddleware,async (req, res) => {
    const {id:productId} = req.params;
    const {_id:userId} = req.user._id;
    const {changes} = req.body;
    try {
        const review = new Review({
            productId,
            userId,
            changes
        });
        const newReview = await review.save();
        res.status(201).json(newReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/allRequests',isAdminMiddleware,async (req, res) => {
    try {
        let reviews = await Review.find({});
        const pendingCount = await Review.countDocuments({ status: 'pending' });
        const approvedCount = await Review.countDocuments({ status: 'approved' });
        const rejectedCount = await Review.countDocuments({ status: 'rejected' });

        reviews = {
            data: reviews,
            counts: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount
            }
        };
        res.status(200).json(reviews);
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message });
    }
});

router.get('/mySubmissions',authMiddleware,async (req, res) => {
    const {_id:userId} = req.user._id;
    try {
        const reviews = await Review.find({userId});
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
);

router.get('/request/:id',isAdminMiddleware,async (req, res) => {
    const {id} = req.params;
    try {
        const review = await Review.findById(id);
        if(!review){
            return res.status(404).json({message:'Review not found'});
        }
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/approveRequest/:id',isAdminMiddleware,async (req, res) => {
    const {id} = req.params;
    try {
        const review = await Review.findByIdAndUpdate(id,{status:'approved'},{new:true});
        if(!review){
            return res.status(404).json({message:'Review not found'});
        }

        const producdId = review.productId;
        const changes = review.changes;
        const product = await Product.findByIdAndUpdate(producdId,changes,{new:true});
        if(!product){
            return res.status(404).json({message:'Product not found'});
        }
        

        res.status(201).json({review,product});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

router.patch('/rejectRequest/:id',isAdminMiddleware,async (req, res) => {
    const {id} = req.params;
    try {
        const review = await Review.findByIdAndUpdate(id,{status:'rejected'},{new:true});
        if(!review){
            return res.status(404).json({message:'Review not found'});
        }
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
);












export default router;
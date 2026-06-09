const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

const {
  createPolicyData,
  getPolicyDatas,
  getPolicyDataById,
  updatePolicyData,
  deletePolicyData,
} = require('../controllers/policyDataController');

router.post('/create', authMiddleware, createPolicyData);
router.get('/', authMiddleware, getPolicyDatas);
router.get('/:id', authMiddleware, getPolicyDataById);
router.put('/update/:id', authMiddleware, updatePolicyData);
router.delete('/delete/:id', authMiddleware, deletePolicyData);

module.exports = router;

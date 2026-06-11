const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth');

const {
  createPolicyData,
  getPolicyDatas,
  getPolicyDataById,
  updatePolicyData,
  deletePolicyData,
  getPendingPolicyRequests,
  approvePolicyRequest,
  rejectPolicyRequest,
} = require('../controllers/policyDataController');


// =========================
// CREATE POLICY
// =========================
router.post(
  '/create',
  authMiddleware,
  createPolicyData
);


// =========================
// GET ALL POLICIES
// =========================
router.get(
  '/',
  authMiddleware,
  getPolicyDatas
);


// =========================
// GET SINGLE POLICY
// =========================
router.get(
  '/:id',
  authMiddleware,
  getPolicyDataById
);


// =========================
// UPDATE POLICY
// Executive → request send
// Admin/TL → direct update
// =========================
router.put(
  '/update/:id',
  authMiddleware,
  updatePolicyData
);


// =========================
// GET PENDING REQUESTS
// TL/Admin Dashboard
// =========================
router.get(
  '/pending-requests',
  authMiddleware,
  getPendingPolicyRequests
);


// =========================
// APPROVE REQUEST
// TL/Admin approve
// =========================
router.put(
  '/approve/:id',
  authMiddleware,
  approvePolicyRequest
);


// =========================
// REJECT REQUEST
// TL/Admin reject
// =========================
router.put(
  '/reject/:id',
  authMiddleware,
  rejectPolicyRequest
);


// =========================
// DELETE POLICY
// =========================
router.delete(
  '/delete/:id',
  authMiddleware,
  deletePolicyData
);

module.exports = router;
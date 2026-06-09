const PolicyData = require('../models/PolicyData');
const Application = require('../models/Application');

exports.createPolicyData = async (req, res) => {
  try {
    const payload = req.body || {};

    if (!payload.application) {
      return res.status(400).json({ message: 'application id is required' });
    }

    const app = await Application.findById(payload.application);
    if (!app) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    // attach creator info when available
    if (req.user) {
      payload.createdBy = req.user.id;
      payload.createdByRole = req.user.role;
    }

    const pd = new PolicyData(payload);
    await pd.save();

    return res.status(201).json({ message: 'PolicyData created', data: pd });
  } catch (err) {
    console.error('Create PolicyData error:', err);
    return res.status(500).json({ message: err.message || 'Server Error' });
  }
};

exports.getPolicyDatas = async (req, res) => {
  try {
    const list = await PolicyData.find().populate('application', 'applicationId user');
    return res.json(list);
  } catch (err) {
    console.error('Get PolicyData list error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPolicyDataById = async (req, res) => {
  try {
    const pd = await PolicyData.findById(req.params.id).populate('application', 'applicationId user');
    if (!pd) return res.status(404).json({ message: 'Not found' });
    return res.json(pd);
  } catch (err) {
    console.error('Get PolicyData error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.updatePolicyData = async (req, res) => {
  try {
    const payload = req.body || {};
    // validate application if included
    if (payload.application) {
      const app = await Application.findById(payload.application);
      if (!app) return res.status(400).json({ message: 'Invalid application id' });
    }

    // fetch existing
    const existing = await PolicyData.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // If requester is an executive, prevent updates until both admin and teamleader approvals
    const requesterRole = req.user?.role;
    const isFullyApproved = existing.isApprovedByAdmin && existing.isApprovedByTeamLeader;

    if (requesterRole === 'executive' && !isFullyApproved) {
      return res.status(403).json({ message: 'Cannot update policy data until approved by admin and teamleader' });
    }

    const pd = await PolicyData.findByIdAndUpdate(req.params.id, payload, { new: true });
    return res.json({ message: 'Updated', data: pd });
  } catch (err) {
    console.error('Update PolicyData error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.deletePolicyData = async (req, res) => {
  try {
    const pd = await PolicyData.findByIdAndDelete(req.params.id);
    if (!pd) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete PolicyData error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

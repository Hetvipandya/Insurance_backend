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

exports.updatePolicyData = async (
  req,
  res
) => {
  try {
    const payload = req.body || {};

    const existing =
      await PolicyData.findById(
        req.params.id
      );

    if (!existing) {
      return res.status(404).json({
        message: 'Policy not found',
      });
    }

    const requesterRole =
      req.user?.role;

    // Executive edit request
    if (
      requesterRole ===
      'executive'
    ) {
      existing.editRequest =
        payload;

      existing.editRequestStatus =
        'pending';

      existing.editRequestedBy =
        req.user.id;

      existing.teamLeaderApproval =
        'pending';

      existing.adminApproval =
        'pending';

      await existing.save();

      return res.json({
        message:
          'Edit request sent to Team Leader & Admin',
      });
    }

    // TeamLeader/Admin direct update
    const updated =
      await PolicyData.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true }
      );

    return res.json({
      message:
        'Policy updated',
      data: updated,
    });

  } catch (err) {
    console.error(
      'Update PolicyData error:',
      err
    );

    return res.status(500).json({
      message: 'Server Error',
    });
  }
};

exports.getPendingPolicyRequests =
  async (req, res) => {
    try {
      const data =
        await PolicyData.find({
          editRequestStatus:
            'pending',
        })
          .populate(
            'application'
          )
          .populate(
            'editRequestedBy',
            'fullName emailId'
          );

      res.json(data);
    } catch (err) {
      res.status(500).json({
        message:
          'Server Error',
      });
    }
  };

  exports.approvePolicyRequest =
  async (req, res) => {
    try {
      const policy =
        await PolicyData.findById(
          req.params.id
        );

      if (!policy) {
        return res.status(404).json({
          message:
            'Policy not found',
        });
      }

      const role =
        req.user.role;

      // TL approval
      if (
        role ===
        'teamleader'
      ) {
        policy.teamLeaderApproval =
          'approved';
      }

      // Admin approval
      if (
        role === 'admin'
      ) {
        policy.adminApproval =
          'approved';
      }

      // Both approved
      if (
        policy
          .teamLeaderApproval ===
          'approved' &&
        policy
          .adminApproval ===
          'approved'
      ) {
        Object.assign(
          policy,
          policy.editRequest
        );

        policy.editRequest =
          null;

        policy.editRequestStatus =
          'approved';
      }

      await policy.save();

      res.json({
        message:
          'Approved Successfully',
      });

    } catch (err) {
      res.status(500).json({
        message:
          'Server Error',
      });
    }
  };

  exports.rejectPolicyRequest =
  async (req, res) => {
    try {
      const policy =
        await PolicyData.findById(
          req.params.id
        );

      if (!policy) {
        return res.status(404).json({
          message:
            'Policy not found',
        });
      }

      policy.editRequestStatus =
        'rejected';

      policy.editRequest =
        null;

      await policy.save();

      res.json({
        message:
          'Request Rejected',
      });

    } catch (err) {
      res.status(500).json({
        message:
          'Server Error',
      });
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

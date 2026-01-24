import React from 'react';
import './OrgAnalytics.css';

const OrgReports = () => {
  return (
    <div className="org-reports">
      <div className="reports-header">
        <h1>Reports</h1>
        <p>Generate comprehensive emission reports in PDF and CSV formats</p>
      </div>

      <div className="coming-soon">
        <span className="icon">📑</span>
        <h2>Report Generation</h2>
        <p>Export audit-ready emission reports for compliance and stakeholders</p>
        <ul>
          <li>📄 PDF report generation</li>
          <li>📊 Excel/CSV data export</li>
          <li>✅ GHG Protocol compliant</li>
          <li>📈 Visual charts & graphs</li>
          <li>🔒 Audit trail documentation</li>
        </ul>
      </div>
    </div>
  );
};

export default OrgReports;

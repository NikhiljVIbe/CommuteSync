import nodemailer from 'nodemailer';
import { RouteDurationInfo } from './googleMapsService';

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d);

export const sendNotificationEmail = async (
  toEmail: string,
  sourceAddress: string,
  destinationAddress: string,
  optimalTimeInfo: RouteDurationInfo,
  allResults: RouteDurationInfo[]
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const leaveAt = fmt(optimalTimeInfo.departureTime);
    const arriveBy = fmt(
      new Date(optimalTimeInfo.departureTime.getTime() + optimalTimeInfo.durationSeconds * 1000)
    );

    // Build alternatives table rows — show 3 closest in time to optimal, sorted by time
    const closestAlternatives = [...allResults]
      .filter(r => r !== optimalTimeInfo)
      .sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime())
      .slice(0, 6);

    const alternativeRows = closestAlternatives
      .map(r => {
        const isOptimal = r === optimalTimeInfo;
        const bg = isOptimal ? 'rgba(56,189,248,0.12)' : 'transparent';
        const color = isOptimal ? '#7dd3fc' : '#94a3b8';
        return `
          <tr style="background:${bg}">
            <td style="padding:10px 14px; color:${color}; font-size:13px;">${fmt(r.departureTime)}</td>
            <td style="padding:10px 14px; color:${color}; font-size:13px; text-align:center;">${r.durationText}</td>
            <td style="padding:10px 14px; color:${color}; font-size:13px; text-align:center;">${r.distanceKm ? r.distanceKm + ' km' : '—'}</td>
          </tr>`;
      })
      .join('');

    const mailOptions = {
      from: `CommuteSync <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🚗 Leave at ${leaveAt} — Optimized commute to ${destinationAddress.split(',')[0]}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;background:#0d1a3a;color:#e2e8f0;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0f3460,#1a1a4e);padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:rgba(148,163,184,0.5);">CommuteSync</p>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9;">Your Optimal Departure Time</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#64748b;">
              ${sourceAddress.split(',')[0]} &nbsp;→&nbsp; ${destinationAddress.split(',')[0]}
            </p>
          </div>

          <!-- Hero Departure Time -->
          <div style="padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 6px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Leave at</p>
            <p style="margin:0;font-size:56px;font-weight:900;background:linear-gradient(135deg,#38bdf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;">${leaveAt}</p>
            <p style="margin:12px 0 0;font-size:14px;color:#94a3b8;">
              to arrive by approximately <strong style="color:#e2e8f0;">${arriveBy}</strong>
            </p>
          </div>

          <!-- Trip Summary -->
          <div style="padding:24px 32px;display:flex;gap:16px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:inline-block;margin-right:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Travel Time</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#38bdf8;">${optimalTimeInfo.durationText}</p>
            </div>
            ${optimalTimeInfo.distanceKm ? `
            <div style="display:inline-block;margin-right:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Distance</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:#a78bfa;">${optimalTimeInfo.distanceKm} km</p>
            </div>` : ''}
            ${optimalTimeInfo.routeSummary ? `
            <div style="display:inline-block;">
              <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Best Route</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#e2e8f0;">${optimalTimeInfo.routeSummary}</p>
            </div>` : ''}
          </div>

          <!-- Google Maps Button -->
          <div style="padding:24px 32px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.06);">
            <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(sourceAddress)}&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving" 
               style="display:inline-block; padding:12px 24px; background:#4285F4; color:#ffffff; text-decoration:none; font-weight:600; border-radius:8px; font-size:14px;">
               📍 Open in Google Maps
            </a>
          </div>

          <!-- Alternatives Table -->
          <div style="padding:24px 32px;">
            <p style="margin:0 0 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(148,163,184,0.5);">Alternative Departure Times</p>
            <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
              <thead>
                <tr style="background:rgba(255,255,255,0.04);">
                  <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:rgba(148,163,184,0.5);text-transform:uppercase;letter-spacing:0.8px;">Leave at</th>
                  <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:600;color:rgba(148,163,184,0.5);text-transform:uppercase;letter-spacing:0.8px;">Travel Time</th>
                  <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:600;color:rgba(148,163,184,0.5);text-transform:uppercase;letter-spacing:0.8px;">Distance</th>
                </tr>
              </thead>
              <tbody>${alternativeRows}</tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(148,163,184,0.3);">CommuteSync · Powered by Google Maps Routes API · Traffic analyzed from -1 hr to +3 hrs</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

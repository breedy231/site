// src/pages/kindle-dashboard.js
import React from "react"
import { Helmet } from "react-helmet"

const KindleDashboard = () => {
  // Get current date and time
  const now = new Date()
  const timeOptions = { hour: '2-digit', minute: '2-digit' }
  const formattedTime = now.toLocaleTimeString('en-US', timeOptions)
  
  return (
    <div style={{
      // Ultra-narrow width to diagnose screen issues
      width: "400px", 
      height: "800px",
      backgroundColor: "white",
      color: "black",
      padding: "8px",
      fontFamily: "sans-serif",
      boxSizing: "border-box",
      position: "relative",
    }}>
      <Helmet>
        <title>Kindle Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      
      <header style={{ 
        borderBottom: "2px solid black",
        paddingBottom: "6px",
        marginBottom: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0, fontSize: "20px" }}>Mission Control</h1>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>{formattedTime}</div>
        </div>
      </header>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Weather Widget */}
        <div style={{ 
          border: "1px solid black",
          padding: "8px",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ margin: 0, fontSize: "16px" }}>Weather</h2>
          <div>
            <div style={{ fontSize: "24px", fontWeight: "bold", textAlign: "right" }}>
              72°
            </div>
          </div>
        </div>
        
        {/* Calendar Widget */}
        <div style={{ 
          border: "1px solid black",
          padding: "8px",
          borderRadius: "4px"
        }}>
          <h2 style={{ margin: 0, fontSize: "16px", marginBottom: "6px" }}>Calendar</h2>
          <ul style={{ fontSize: "12px", paddingLeft: "15px", margin: 0, lineHeight: "1.2" }}>
            <li>9:00 - Meeting</li>
            <li>12:30 - Lunch</li>
            <li>3:00 - Review</li>
          </ul>
        </div>
        
        {/* Tasks Widget */}
        <div style={{ 
          border: "1px solid black",
          padding: "8px",
          borderRadius: "4px"
        }}>
          <h2 style={{ margin: 0, fontSize: "16px", marginBottom: "6px" }}>Tasks</h2>
          <ul style={{ fontSize: "12px", paddingLeft: "15px", margin: 0, lineHeight: "1.2" }}>
            <li>Dashboard</li>
            <li>Reports</li>
            <li>Website</li>
            <li>Equipment</li>
          </ul>
        </div>
        
        {/* Server Status Widget */}
        <div style={{ 
          border: "1px solid black",
          padding: "8px",
          borderRadius: "4px"
        }}>
          <h2 style={{ margin: 0, fontSize: "16px", marginBottom: "6px" }}>Server</h2>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "15%" }}>CPU:</td>
                <td>12%</td>
              </tr>
              <tr>
                <td>RAM:</td>
                <td>3.2G</td>
              </tr>
              <tr>
                <td>Disk:</td>
                <td>234G</td>
              </tr>
              <tr>
                <td>Up:</td>
                <td>7d</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Network Widget */}
        <div style={{ 
          border: "1px solid black",
          padding: "8px",
          borderRadius: "4px"
        }}>
          <h2 style={{ margin: 0, fontSize: "16px", marginBottom: "6px" }}>Network</h2>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "15%" }}>Status:</td>
                <td>Online</td>
              </tr>
              <tr>
                <td>Dev:</td>
                <td>12</td>
              </tr>
              <tr>
                <td>Down:</td>
                <td>12M</td>
              </tr>
              <tr>
                <td>Up:</td>
                <td>5M</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <footer style={{ 
        borderTop: "1px solid black",
        marginTop: "8px",
        paddingTop: "6px",
        textAlign: "center",
        fontSize: "10px",
        position: "absolute", 
        bottom: "8px",
        left: "8px",
        right: "8px"
      }}>
        Updated: {formattedTime}
      </footer>
    </div>
  )
}

export default KindleDashboard
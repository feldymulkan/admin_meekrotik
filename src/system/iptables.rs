use std::process::Command;
use tracing::{info, error};

pub struct IptablesRule {
    pub protocol: String,
    pub external_port: i32,
    pub internal_ip: String,
    pub internal_port: i32,
}

pub fn add_port_forward(rule: &IptablesRule) -> Result<(), String> {
    let status = Command::new("iptables")
        .args([
            "-t", "nat",
            "-A", "PREROUTING",
            "-p", &rule.protocol,
            "--dport", &rule.external_port.to_string(),
            "-j", "DNAT",
            "--to-destination", &format!("{}:{}", rule.internal_ip, rule.internal_port),
        ])
        .status()
        .map_err(|e| format!("Failed to execute iptables: {}", e))?;

    if status.success() {
        info!("Added iptables rule: {} -> {}:{}", rule.external_port, rule.internal_ip, rule.internal_port);
        
        // Also add FORWARD rule to allow traffic
        let _ = Command::new("iptables")
            .args([
                "-A", "FORWARD",
                "-p", &rule.protocol,
                "-d", &rule.internal_ip,
                "--dport", &rule.internal_port.to_string(),
                "-j", "ACCEPT",
            ])
            .status();

        Ok(())
    } else {
        error!("iptables command failed with status: {}", status);
        Err("iptables command failed".to_string())
    }
}

pub fn remove_port_forward(rule: &IptablesRule) -> Result<(), String> {
    let status = Command::new("iptables")
        .args([
            "-t", "nat",
            "-D", "PREROUTING",
            "-p", &rule.protocol,
            "--dport", &rule.external_port.to_string(),
            "-j", "DNAT",
            "--to-destination", &format!("{}:{}", rule.internal_ip, rule.internal_port),
        ])
        .status()
        .map_err(|e| format!("Failed to execute iptables: {}", e))?;

    if status.success() {
        info!("Removed iptables rule: {} -> {}:{}", rule.external_port, rule.internal_ip, rule.internal_port);
        
        // Also remove FORWARD rule
        let _ = Command::new("iptables")
            .args([
                "-D", "FORWARD",
                "-p", &rule.protocol,
                "-d", &rule.internal_ip,
                "--dport", &rule.internal_port.to_string(),
                "-j", "ACCEPT",
            ])
            .status();

        Ok(())
    } else {
        error!("iptables command failed with status: {}", status);
        Err("iptables command failed".to_string())
    }
}

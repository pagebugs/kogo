<?php
// bridge.php - Server-side deployment agent
header('Content-Type: text/plain; charset=utf-8');

$token = $_GET['token'] ?? '';
$validToken = 'KoghaDeploy2026'; // Simple security token

if ($token !== $validToken) {
    http_response_code(403);
    die('Access Denied: Invalid Token');
}

$action = $_GET['action'] ?? '';
$timestamp = date('Ymd_His');
$backupDir = 'backup_' . date('Ymd'); // Daily grouping

// Avoid creating too many backup folders if run multiple times a day? No, date('Ymd') is fine.
// If folder exists, we move into it. If files clash?
// Better to use unique backup dir for safety: backup_Ymd_His
$backupDir = 'backup_' . $timestamp;

function recursiveMove($src, $dest) {
    // PHP rename works for directories too on same filesystem
    return rename($src, $dest);
}

if ($action === 'check') {
    echo "Bridge is Ready. PHP Version: " . phpversion();

} elseif ($action === 'backup') {
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }

    $files = scandir('.');
    $count = 0;
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        // Exclude self, zip, and existing backups
        if ($file === 'bridge.php') continue;
        if ($file === 'deploy_pkg.zip') continue;
        if (strpos($file, 'backup_') === 0) continue;
        // Exclude specific system folders if needed? No, backup everything usually.
        
        if (rename($file, $backupDir . '/' . $file)) {
            $count++;
        }
    }
    echo "Backup Complete. Moved $count items to $backupDir";

} elseif ($action === 'unzip') {
    if (!class_exists('ZipArchive')) {
        die("Error: ZipArchive class not found.");
    }

    $zip = new ZipArchive;
    $res = $zip->open('deploy_pkg.zip');
    if ($res === TRUE) {
        $zip->extractTo('.');
        $zip->close();
        echo "Unzip Success.";
        // Optional: delete zip
        unlink('deploy_pkg.zip');
        // Self-destruct?
        // unlink(__FILE__); 
    } else {
        echo "Unzip Failed (Code: $res)";
    }
} else {
    echo "Unknown Action";
}
?>

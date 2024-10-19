from flask import Flask, send_from_directory, request, jsonify
import asyncio
import datetime
import json
import os
from collections import defaultdict
import subprocess

app = Flask(__name__, static_folder='azure-snapshot-manager/build', static_url_path='')

# Global variables
log_dir = "logs"
snap_rid_list_file = "snap_rid_list.txt"
inventory_file = 'linux_vm-inventory.csv'
TTL_DURATION = 7  # Number of days for the snapshots to be valid

# ... (keep all the existing functions)

@app.route('/api/azure-login', methods=['GET'])
def azure_login():
    try:
        # Run the 'az login' command
        process = subprocess.Popen(['az', 'login'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            # Parse the JSON output to get the login URL
            login_info = json.loads(stdout)
            login_url = login_info[0]['verificationUrl']
            user_code = login_info[0]['userCode']
            
            return jsonify({
                'login_url': login_url,
                'user_code': user_code
            })
        else:
            return jsonify({'error': 'Failed to initiate Azure login'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-snapshots', methods=['POST'])
def create_snapshots():
    host_file = request.json.get('host_file', 'snapshot_vmlist.txt')
    chg_number = request.json.get('chg_number')
    ttl_duration = int(request.json.get('ttl_duration', TTL_DURATION))

    # Call the main function with the provided parameters
    result = asyncio.run(main(host_file, chg_number, ttl_duration))

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import subprocess
import threading
import os
import sys
import webbrowser
import time
import json
import requests
from datetime import datetime

# Configuration
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

class ProjectManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("SaaS Master Control Panel")
        self.root.geometry("1200x750")
        self.root.configure(bg="#f0f2f5")

        self.server_process = None
        self.is_server_running = False
        self.mongo_status = "Unknown"

        self.setup_styles()
        self.create_layout()
        
        # Check initial status
        self.check_server_status()
        self.check_mongodb_status()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Colors
        bg_color = "#f0f2f5"
        primary_color = "#2c3e50"
        accent_color = "#e74c3c"
        success_color = "#27ae60"
        warning_color = "#f39c12"
        text_color = "#333333"
        
        style.configure("TFrame", background=bg_color)
        style.configure("TLabel", background=bg_color, foreground=text_color, font=("Segoe UI", 10))
        style.configure("Header.TLabel", font=("Segoe UI", 20, "bold"), foreground=primary_color)
        style.configure("Status.TLabel", font=("Segoe UI", 11, "bold"))
        style.configure("Info.TLabel", font=("Segoe UI", 9), foreground="#7f8c8d")
        
        style.configure("TButton", font=("Segoe UI", 9), padding=8)
        style.map("TButton", background=[('active', '#bdc3c7')])
        
        style.configure("Primary.TButton", background=primary_color, foreground="white", font=("Segoe UI", 10, "bold"))
        style.configure("Danger.TButton", background=accent_color, foreground="white", font=("Segoe UI", 10, "bold"))
        style.configure("Success.TButton", background=success_color, foreground="white", font=("Segoe UI", 10, "bold"))
        style.configure("Warning.TButton", background=warning_color, foreground="white", font=("Segoe UI", 10, "bold"))

    def create_layout(self):
        # Main Container
        main_container = ttk.Frame(self.root, padding="20")
        main_container.pack(fill=tk.BOTH, expand=True)

        # Header
        header_frame = ttk.Frame(main_container)
        header_frame.pack(fill=tk.X, pady=(0, 15))
        
        title_frame = ttk.Frame(header_frame)
        title_frame.pack(side=tk.LEFT)
        
        ttk.Label(title_frame, text="🚀 Chatbot SaaS Control Center", style="Header.TLabel").pack(anchor="w")
        ttk.Label(title_frame, text=f"Project: {os.path.basename(PROJECT_ROOT)}", style="Info.TLabel").pack(anchor="w")
        
        status_frame = ttk.Frame(header_frame)
        status_frame.pack(side=tk.RIGHT)
        
        self.status_indicator = ttk.Label(status_frame, text="● System Offline", foreground="red", style="Status.TLabel")
        self.status_indicator.pack()
        
        self.db_status_indicator = ttk.Label(status_frame, text="MongoDB: Unknown", foreground="gray", font=("Segoe UI", 9))
        self.db_status_indicator.pack()

        # Notebook (Tabs)
        self.notebook = ttk.Notebook(main_container)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        # Tab 1: Operations (Server & Links)
        self.create_operations_tab()
        
        # Tab 2: Admin Tools (User Management)
        self.create_admin_tab()
        
        # Tab 3: Database
        self.create_database_tab()
        
        # Tab 4: Environment (Config)
        self.create_env_tab()

        # Tab 5: Logs
        self.create_logs_tab()
        
        # Tab 6: System Info
        self.create_system_tab()

    def create_operations_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="   Operations   ")

        # Server Control Section
        control_frame = ttk.LabelFrame(tab, text="Server Control", padding=15)
        control_frame.pack(fill=tk.X, pady=(0, 20))

        btn_frame = ttk.Frame(control_frame)
        btn_frame.pack(fill=tk.X)

        self.start_btn = ttk.Button(btn_frame, text="▶ Start Server", command=self.start_server, style="Primary.TButton")
        self.start_btn.pack(side=tk.LEFT, padx=5)

        self.stop_btn = ttk.Button(btn_frame, text="⏹ Stop Server", command=self.stop_server, state=tk.DISABLED, style="Danger.TButton")
        self.stop_btn.pack(side=tk.LEFT, padx=5)

        ttk.Button(btn_frame, text="🔄 Restart", command=self.restart_server).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="🏥 Health Check", command=self.check_health, style="Success.TButton").pack(side=tk.LEFT, padx=5)

        # Quick Links Section
        links_frame = ttk.LabelFrame(tab, text="Quick Access", padding=15)
        links_frame.pack(fill=tk.X, pady=20)

        grid_frame = ttk.Frame(links_frame)
        grid_frame.pack(fill=tk.X)

        links = [
            ("🏠 Landing", "http://localhost:5000/frontend/index.html"),
            ("📊 Dashboard", "http://localhost:5000/frontend/dashboard.html"),
            ("🛡️ Admin", "http://localhost:5000/frontend/admin_login.html"),
            ("🤖 Widget", "http://localhost:5000/widget/demo.html"),
            ("💰 Pricing", "http://localhost:5000/frontend/pricing.html"),
            ("📝 Register", "http://localhost:5000/frontend/register.html")
        ]

        for i, (text, url) in enumerate(links):
            row = i // 3
            col = i % 3
            btn = ttk.Button(grid_frame, text=text, command=lambda u=url: webbrowser.open(u), width=15)
            btn.grid(row=row, column=col, padx=5, pady=5, sticky="ew")

        # Project Info
        info_frame = ttk.LabelFrame(tab, text="Project Info", padding=15)
        info_frame.pack(fill=tk.BOTH, expand=True, pady=20)
        
        info_text = f"""
        Project Root: {PROJECT_ROOT}
        Backend: Node.js (Express)
        Database: MongoDB
        Frontend: Vanilla JS / HTML
        """
        ttk.Label(info_frame, text=info_text, justify=tk.LEFT).pack(anchor="w")

    def create_admin_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="   Admin Tools   ")

        # Make Admin Section
        admin_frame = ttk.LabelFrame(tab, text="Promote User to Admin", padding=15)
        admin_frame.pack(fill=tk.X, pady=(0, 20))

        ttk.Label(admin_frame, text="Enter User Email:").pack(anchor="w", pady=(0, 5))
        
        self.admin_email_entry = ttk.Entry(admin_frame, width=40)
        self.admin_email_entry.pack(anchor="w", pady=(0, 10))

        ttk.Button(admin_frame, text="Make Admin", command=self.make_user_admin, style="Primary.TButton").pack(anchor="w")

        # Reset Default Admin
        reset_frame = ttk.LabelFrame(tab, text="Emergency Access", padding=15)
        reset_frame.pack(fill=tk.X, pady=20)

        ttk.Label(reset_frame, text="Lost access? Re-create the default admin account (admin@chatbotbuilder.com).").pack(anchor="w", pady=(0, 10))
        ttk.Button(reset_frame, text="Reset Default Admin", command=self.reset_default_admin, style="Danger.TButton").pack(anchor="w")

    def create_database_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="   Database   ")

        # MongoDB Status
        status_frame = ttk.LabelFrame(tab, text="MongoDB Status", padding=15)
        status_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.db_status_label = ttk.Label(status_frame, text="Status: Checking...", font=("Segoe UI", 11))
        self.db_status_label.pack(anchor="w", pady=5)
        
        ttk.Button(status_frame, text="🔄 Refresh Status", command=self.check_mongodb_status).pack(anchor="w", pady=5)

        # Database Operations
        ops_frame = ttk.LabelFrame(tab, text="Database Operations", padding=15)
        ops_frame.pack(fill=tk.X, pady=20)

        ttk.Label(ops_frame, text="⚠️ Warning: These operations affect your production data!").pack(anchor="w", pady=(0, 10))
        
        ops_btn_frame = ttk.Frame(ops_frame)
        ops_btn_frame.pack(fill=tk.X)
        
        ttk.Button(ops_btn_frame, text="📦 Backup Database", command=self.backup_database, style="Primary.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(ops_btn_frame, text="📥 Restore Database", command=self.restore_database, style="Warning.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(ops_btn_frame, text="🗑️ Clear All Data", command=self.clear_database, style="Danger.TButton").pack(side=tk.LEFT, padx=5)

    def create_env_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="   Environment (.env)   ")

        btn_frame = ttk.Frame(tab)
        btn_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(btn_frame, text="💾 Save Changes", command=self.save_env, style="Primary.TButton").pack(side=tk.LEFT)
        ttk.Button(btn_frame, text="🔄 Reload", command=self.load_env).pack(side=tk.LEFT, padx=10)

        self.env_editor = scrolledtext.ScrolledText(tab, width=80, height=20, font=("Consolas", 10))
        self.env_editor.pack(fill=tk.BOTH, expand=True)
        
        self.load_env()

    def create_logs_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="   Server Logs   ")

        btn_frame = ttk.Frame(tab)
        btn_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(btn_frame, text="🗑️ Clear Logs", command=lambda: self.log_area.delete('1.0', tk.END)).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="💾 Export Logs", command=self.export_logs).pack(side=tk.LEFT, padx=5)

        self.log_area = scrolledtext.ScrolledText(tab, width=80, height=20, font=("Consolas", 9), bg="#1e1e1e", fg="#d4d4d4")
        self.log_area.pack(fill=tk.BOTH, expand=True)

    def create_system_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="   System Info   ")

        # System Stats
        stats_frame = ttk.LabelFrame(tab, text="System Information", padding=15)
        stats_frame.pack(fill=tk.BOTH, expand=True)
        
        info_text = f"""
        Operating System: {sys.platform}
        Python Version: {sys.version.split()[0]}
        Project Root: {PROJECT_ROOT}
        Backend Directory: {BACKEND_DIR}
        Frontend Directory: {FRONTEND_DIR}
        
        Node.js: {self.get_node_version()}
        NPM: {self.get_npm_version()}
        
        Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        ttk.Label(stats_frame, text=info_text, justify=tk.LEFT, font=("Consolas", 10)).pack(anchor="w", fill=tk.BOTH, expand=True)

    # --- Logic ---

    def log(self, message):
        timestamp = time.strftime('%H:%M:%S')
        formatted_msg = f"[{timestamp}] {message}"
        self.log_area.insert(tk.END, formatted_msg + "\n")
        self.log_area.see(tk.END)
        print(formatted_msg)  # Also print to console for debugging

    def start_server(self):
        if self.is_server_running:
            self.log("⚠️ Server is already running!")
            return

        self.log("=" * 60)
        self.log("Starting server...")
        self.log(f"Backend Directory: {BACKEND_DIR}")
        self.log("=" * 60)
        
        def run_process():
            # First check if node and npm are installed
            try:
                node_check = subprocess.run("node --version", shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=BACKEND_DIR)
                npm_check = subprocess.run("npm --version", shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=BACKEND_DIR)
                
                self.root.after(0, self.log, f"✅ Node.js: {node_check.stdout.strip()}")
                self.root.after(0, self.log, f"✅ NPM: {npm_check.stdout.strip()}")
            except Exception as e:
                self.root.after(0, self.log, f"❌ Node.js or NPM not found: {str(e)}")
                self.root.after(0, messagebox.showerror, "Error", "Node.js is not installed or not in PATH")
                return
            
            # Check if node_modules exists
            node_modules = os.path.join(BACKEND_DIR, "node_modules")
            if not os.path.exists(node_modules):
                self.root.after(0, self.log, "⚠️ node_modules not found. Installing dependencies...")
                install_result = subprocess.run("npm install", shell=True, cwd=BACKEND_DIR, capture_output=True, text=True, encoding='utf-8', errors='replace')
                self.root.after(0, self.log, install_result.stdout)
                if install_result.stderr:
                    self.root.after(0, self.log, f"STDERR: {install_result.stderr}")
            
            # Use npm start in backend directory
            cmd = "npm start"
            
            try:
                self.root.after(0, self.log, f"Executing: {cmd}")
                self.server_process = subprocess.Popen(
                    cmd, 
                    shell=True, 
                    cwd=BACKEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,  # Merge stderr into stdout
                    universal_newlines=True,
                    encoding='utf-8',
                    errors='replace',  # Replace problematic characters instead of crashing
                    bufsize=1
                )
                
                self.is_server_running = True
                self.root.after(0, self.update_ui_state, True)
                self.root.after(0, self.log, "✅ Server process started. Waiting for output...")
                
                # Read output line by line
                try:
                    for line in iter(self.server_process.stdout.readline, ''):
                        if not line:
                            break
                        cleaned_line = line.strip()
                        if cleaned_line:
                            self.root.after(0, self.log, cleaned_line)
                except Exception as read_error:
                    self.root.after(0, self.log, f"Error reading output: {str(read_error)}")
                
                # Wait for process to end
                self.server_process.wait()
                return_code = self.server_process.returncode
                
                # If process ends
                self.is_server_running = False
                self.root.after(0, self.update_ui_state, False)
                self.root.after(0, self.log, f"❌ Server stopped. Exit code: {return_code}")
                
            except Exception as e:
                self.root.after(0, self.log, f"❌ Error starting server: {str(e)}")
                self.root.after(0, self.log, f"Exception type: {type(e).__name__}")
                self.is_server_running = False
                self.root.after(0, self.update_ui_state, False)

        threading.Thread(target=run_process, daemon=True).start()

    def stop_server(self):
        if not self.is_server_running or not self.server_process:
            self.log("⚠️ No server process is running")
            return

        self.log("=" * 60)
        self.log("Stopping server...")
        self.log("=" * 60)
        
        try:
            # This is tricky on Windows with shell=True, often kills only the shell, not the node process.
            # We'll try a forceful kill of node.exe for this project context
            if sys.platform == "win32":
                self.log("Killing all Node.js processes...")
                result = subprocess.run("taskkill /F /IM node.exe", shell=True, capture_output=True, text=True)
                self.log(result.stdout)
                if result.stderr:
                    self.log(f"STDERR: {result.stderr}")
            else:
                self.log("Terminating server process...")
                self.server_process.terminate()
                self.server_process.wait(timeout=5)
        except Exception as e:
            self.log(f"Error stopping server: {str(e)}")
        
        self.is_server_running = False
        self.update_ui_state(False)
        self.log("✅ Server stopped successfully")

    def restart_server(self):
        self.log("=" * 60)
        self.log("🔄 Restarting server...")
        self.log("=" * 60)
        self.stop_server()
        self.root.after(3000, self.start_server)

    def update_ui_state(self, running):
        if running:
            self.status_indicator.config(text="● System Online", foreground="green")
            self.start_btn.config(state=tk.DISABLED)
            self.stop_btn.config(state=tk.NORMAL)
        else:
            self.status_indicator.config(text="● System Offline", foreground="red")
            self.start_btn.config(state=tk.NORMAL)
            self.stop_btn.config(state=tk.DISABLED)

    def check_server_status(self):
        # Check if node process is running
        pass

    def check_health(self):
        """Check if the API is responding"""
        self.log("=" * 60)
        self.log("🏥 Checking API health...")
        self.log("=" * 60)
        
        if not self.is_server_running:
            self.log("⚠️ Server is not running. Start the server first.")
            messagebox.showwarning("Server Not Running", "Please start the server before checking health.")
            return
        
        try:
            self.log("Attempting to connect to: http://localhost:5000/api/health")
            response = requests.get("http://localhost:5000/api/health", timeout=10)
            
            self.log(f"Response Status Code: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"Response Body: {json.dumps(data, indent=2)}")
                self.log("✅ API is healthy!")
                messagebox.showinfo("Health Check", f"✅ API is running!\n\nStatus: {data.get('status', 'OK')}\nService: {data.get('service', 'N/A')}")
            else:
                self.log(f"⚠️ API responded with status: {response.status_code}")
                self.log(f"Response: {response.text}")
                messagebox.showwarning("Health Check", f"⚠️ API returned status code: {response.status_code}")
        except requests.exceptions.ConnectionError as e:
            self.log(f"❌ Connection Error: Cannot connect to the server")
            self.log(f"Details: {str(e)}")
            messagebox.showerror("Connection Error", "❌ Cannot connect to the API.\n\nMake sure:\n1. Server is running\n2. Backend is on port 5000\n3. No firewall blocking")
        except requests.exceptions.Timeout:
            self.log("❌ Request timed out after 10 seconds")
            messagebox.showerror("Timeout", "Request timed out. Server might be starting or overloaded.")
        except Exception as e:
            self.log(f"❌ Health check failed: {str(e)}")
            self.log(f"Exception type: {type(e).__name__}")
            messagebox.showerror("Health Check Failed", f"Error: {str(e)}")

    def check_mongodb_status(self):
        """Check MongoDB connection"""
        self.log("=" * 60)
        self.log("🗄️ Checking MongoDB status...")
        self.log("=" * 60)
        
        def check():
            try:
                self.log("Attempting to connect to MongoDB on localhost:27017...")
                # Try to connect via the API health endpoint or direct MongoDB check
                # For simplicity, we'll check if MongoDB port is open
                import socket
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(3)
                result = sock.connect_ex(('localhost', 27017))
                sock.close()
                
                self.root.after(0, self.log, f"Connection result code: {result} (0 = success)")
                
                if result == 0:
                    self.mongo_status = "Connected"
                    self.root.after(0, lambda: self.db_status_indicator.config(text="MongoDB: ✅ Connected", foreground="green"))
                    self.root.after(0, lambda: self.db_status_label.config(text="Status: ✅ MongoDB is running on localhost:27017"))
                    self.root.after(0, self.log, "✅ MongoDB is accessible")
                else:
                    self.mongo_status = "Disconnected"
                    self.root.after(0, lambda: self.db_status_indicator.config(text="MongoDB: ❌ Offline", foreground="red"))
                    self.root.after(0, lambda: self.db_status_label.config(text="Status: ❌ MongoDB is not accessible on port 27017"))
                    self.root.after(0, self.log, "❌ MongoDB is not accessible. Make sure MongoDB is installed and running.")
            except Exception as e:
                self.mongo_status = "Error"
                self.root.after(0, lambda: self.db_status_indicator.config(text="MongoDB: ⚠️ Error", foreground="orange"))
                self.root.after(0, lambda: self.db_status_label.config(text=f"Status: Error - {str(e)}"))
                self.root.after(0, self.log, f"❌ Error checking MongoDB: {str(e)}")
        
        threading.Thread(target=check, daemon=True).start()

    def backup_database(self):
        if not messagebox.askyesno("Confirm Backup", "Create a backup of the database?"):
            return
        
        self.log("Creating database backup...")
        backup_dir = os.path.join(PROJECT_ROOT, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f"backup_{timestamp}")
        
        def run_backup():
            try:
                cmd = f'mongodump --db=chatbot-builder --out="{backup_file}"'
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                self.root.after(0, self.log, f"Backup completed: {backup_file}")
                self.root.after(0, messagebox.showinfo, "Success", f"Database backed up to:\n{backup_file}")
            except Exception as e:
                self.root.after(0, self.log, f"Backup failed: {str(e)}")
                self.root.after(0, messagebox.showerror, "Error", f"Backup failed: {str(e)}")
        
        threading.Thread(target=run_backup, daemon=True).start()

    def restore_database(self):
        backup_file = filedialog.askdirectory(title="Select Backup Folder")
        if not backup_file:
            return
        
        if not messagebox.askyesno("Confirm Restore", "⚠️ This will replace all current data! Continue?"):
            return
        
        self.log(f"Restoring database from {backup_file}...")
        
        def run_restore():
            try:
                cmd = f'mongorestore --db=chatbot-builder "{backup_file}"'
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                self.root.after(0, self.log, "Database restored successfully")
                self.root.after(0, messagebox.showinfo, "Success", "Database restored!")
            except Exception as e:
                self.root.after(0, self.log, f"Restore failed: {str(e)}")
                self.root.after(0, messagebox.showerror, "Error", f"Restore failed: {str(e)}")
        
        threading.Thread(target=run_restore, daemon=True).start()

    def clear_database(self):
        if not messagebox.askyesno("⚠️ DANGER", "This will DELETE ALL DATA from the database!\n\nAre you absolutely sure?"):
            return
        
        # Double confirmation
        if not messagebox.askyesno("⚠️ FINAL WARNING", "Last chance! This cannot be undone!\n\nDelete everything?"):
            return
        
        self.log("Clearing database...")
        
        def run_clear():
            try:
                cmd = 'mongo chatbot-builder --eval "db.dropDatabase()"'
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                self.root.after(0, self.log, "Database cleared")
                self.root.after(0, messagebox.showinfo, "Done", "All data has been deleted")
            except Exception as e:
                self.root.after(0, self.log, f"Clear failed: {str(e)}")
                self.root.after(0, messagebox.showerror, "Error", str(e))
        
        threading.Thread(target=run_clear, daemon=True).start()

    def export_logs(self):
        log_content = self.log_area.get('1.0', tk.END)
        file_path = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialfile=f"server_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        )
        if file_path:
            try:
                with open(file_path, 'w') as f:
                    f.write(log_content)
                messagebox.showinfo("Success", f"Logs exported to:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export logs: {str(e)}")

    def get_node_version(self):
        try:
            result = subprocess.run("node --version", shell=True, capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return "Not installed"

    def get_npm_version(self):
        try:
            result = subprocess.run("npm --version", shell=True, capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return "Not installed"

    def check_server_status(self):
        # Simple check if node is running (not perfect but works for solo dev)
        # In a real app, we'd ping the health endpoint
        pass

    def make_user_admin(self):
        email = self.admin_email_entry.get().strip()
        if not email:
            messagebox.showwarning("Input Error", "Please enter an email address.")
            return

        if messagebox.askyesno("Confirm", f"Make {email} an Admin?"):
            self.log(f"Promoting {email} to Admin...")
            
            def run_script():
                try:
                    result = subprocess.run(
                        f"npm run make-admin {email}", 
                        shell=True, 
                        cwd=BACKEND_DIR,
                        capture_output=True,
                        text=True
                    )
                    self.root.after(0, self.log, result.stdout)
                    if result.stderr:
                        self.root.after(0, self.log, f"Error: {result.stderr}")
                    
                    if result.returncode == 0:
                        self.root.after(0, messagebox.showinfo, "Success", f"{email} is now an Admin.")
                    else:
                        self.root.after(0, messagebox.showerror, "Error", "Failed to update user role.")
                except Exception as e:
                    self.root.after(0, self.log, f"Script error: {str(e)}")

            threading.Thread(target=run_script, daemon=True).start()

    def reset_default_admin(self):
        if messagebox.askyesno("Confirm", "Reset/Create default admin (admin@chatbotbuilder.com)?"):
            self.log("Resetting default admin...")
            
            def run_script():
                try:
                    result = subprocess.run(
                        "npm run create-admin", 
                        shell=True, 
                        cwd=BACKEND_DIR,
                        capture_output=True,
                        text=True
                    )
                    self.root.after(0, self.log, result.stdout)
                    self.root.after(0, messagebox.showinfo, "Success", "Default admin restored.")
                except Exception as e:
                    self.root.after(0, self.log, f"Error: {str(e)}")

            threading.Thread(target=run_script, daemon=True).start()

    def load_env(self):
        env_path = os.path.join(BACKEND_DIR, '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                content = f.read()
            self.env_editor.delete('1.0', tk.END)
            self.env_editor.insert('1.0', content)
        else:
            self.env_editor.insert('1.0', "# No .env file found")

    def save_env(self):
        env_path = os.path.join(BACKEND_DIR, '.env')
        content = self.env_editor.get('1.0', tk.END)
        try:
            with open(env_path, 'w') as f:
                f.write(content.strip())
            messagebox.showinfo("Saved", ".env file updated successfully.")
            self.log("Environment variables updated. Restart server to apply changes.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save .env: {str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = ProjectManagerApp(root)
    root.mainloop()

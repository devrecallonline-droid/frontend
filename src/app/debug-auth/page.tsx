'use client';

import { useState } from 'react';

export default function DebugAuth() {
    const [logs, setLogs] = useState<string[]>([]);
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('TestPass123!');
    const [username, setUsername] = useState('testuser');

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const testRegister = async () => {
        addLog('--- Testing Register ---');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            addLog(`API URL: ${API_URL}`);
            addLog(`Request: POST /register`);
            addLog(`Body: { username: "${username}", email: "${email}", password: "***" }`);

            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            addLog(`Response status: ${response.status}`);
            const data = await response.json();
            addLog(`Response data: ${JSON.stringify(data, null, 2)}`);

            if (response.ok) {
                addLog('✅ Register SUCCESS');
            } else {
                addLog('❌ Register FAILED');
            }
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
            console.error('Register error:', error);
        }
    };

    const testLogin = async () => {
        addLog('--- Testing Login ---');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            addLog(`API URL: ${API_URL}`);
            addLog(`Request: POST /login`);
            addLog(`Body: { email: "${email}", password: "***" }`);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            addLog(`Response status: ${response.status}`);
            const data = await response.json();
            addLog(`Response data: ${JSON.stringify(data, null, 2)}`);

            if (response.ok) {
                addLog('✅ Login SUCCESS');
            } else {
                addLog('❌ Login FAILED');
            }
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
            console.error('Login error:', error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Debug Authentication</h1>
            
            <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                <h3>Test Credentials</h3>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username (for register):</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label>
                    <input 
                        type="text" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={testRegister}
                    style={{ marginRight: '10px', padding: '10px 20px', cursor: 'pointer' }}
                >
                    Test Register
                </button>
                <button 
                    onClick={testLogin}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                    Test Login
                </button>
                <button 
                    onClick={() => setLogs([])}
                    style={{ marginLeft: '10px', padding: '10px 20px', cursor: 'pointer' }}
                >
                    Clear Logs
                </button>
            </div>

            <div style={{ background: '#000', color: '#0f0', padding: '15px', fontFamily: 'monospace', fontSize: '12px', maxHeight: '400px', overflow: 'auto' }}>
                <h3 style={{ color: '#fff', marginTop: 0 }}>Debug Logs:</h3>
                {logs.length === 0 && <div>No logs yet...</div>}
                {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '5px', whiteSpace: 'pre-wrap' }}>{log}</div>
                ))}
            </div>
        </div>
    );
}

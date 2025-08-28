import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface Device {
    id: number
    name: string
    ip: string
    port: number
}

const Connect = () => {
    const { ws, setConnectionStatus } = useWebSocket();
    const [devices, setDevices] = useState<Device[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [connecting, setConnecting] = useState<boolean>(false);
    const [error, setError] = useState<string>('')
    const router = useRouter()

    // Simulate device discovery in the same network
    useEffect(() => {
        const discoverDevices = async (): Promise<void> => {
            try {
                // Simulate network scan delay
                await new Promise(resolve => setTimeout(resolve, 100))
                
                // Hardcode the available monitoring device
                const MonitoringDevices: Device[] = [
                    { id: 1, name: 'Smart IV monitoring device', ip: '192.168.194.50', port: 8000 },
                    { id: 2, name: 'Testing', ip: '192.168.194.195', port: 8000 },
                ]
                
                setDevices(MonitoringDevices)
                setLoading(false)
            } catch (err) {
                setError('Failed to discover devices')
                setLoading(false)
            }
        }

        discoverDevices()
    }, [])


const connectToDevice = async (device: Device): Promise<void> => {
    setConnecting(true);
    setError('');
    
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      // Use the WebSocket from context instead of creating a local one
      const wsUrl = `ws://${device.ip}:${device.port}/ws`;
      ws.current = new WebSocket(wsUrl);

      connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          ws.current?.close();
          throw new Error('Connection timeout');
        }
      }, 5000);

      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        if (!ws.current) {
          reject(new Error('WebSocket not initialized'));
          return;
        }

        ws.current.onopen = () => {
          clearTimeout(connectionTimeout!);
          console.log('WebSocket connection established');
          setConnectionStatus(true);
          resolve();
        };

        ws.current.onerror = (error) => {
          clearTimeout(connectionTimeout!);
          console.error('WebSocket connection error:', error);
          reject(new Error('Connection failed'));
        };

        ws.current.onclose = (event) => {
          clearTimeout(connectionTimeout!);
          if (event.code !== 1000) { // 1000 is normal closure
            reject(new Error(`Connection closed: ${event.reason || 'Unknown reason'}`));
          }
        };
      });

      // Navigate to monitor page
      router.push({
        pathname: '/monitor',
        params: { 
          deviceName: device.name,
          deviceIp: device.ip,
          devicePort: device.port.toString(),
        }
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(`Failed to connect to ${device.name}: ${errorMessage}`);
      setConnectionStatus(false);
      
      // Close WebSocket if it was created
      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
        ws.current = null;
      }
    } finally {
      clearTimeout(connectionTimeout!);
      setConnecting(false);
    }
  };

    const retryDiscovery = (): void => {
        setLoading(true)
        setError('')
        setDevices([])
        // Re-run discovery
        useEffect(() => {
            const rediscover = async (): Promise<void> => {
                await new Promise(resolve => setTimeout(resolve, 100))
                setDevices([
                    { id: 1, name: 'Smart IV monitoring device', ip: '192.168.194.50', port: 5000 },
                ])
                setLoading(false)
            }
            rediscover()
        }, [])
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#0d9488" />
                <Text style={styles.loadingText}>Discovering devices on network...</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Available Devices</Text>
                <Text style={styles.subtitle}>Select a device to connect</Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryDiscovery}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.devicesList}>
                {devices.map((device) => (
                    <TouchableOpacity
                        key={device.id}
                        style={styles.deviceCard}
                        onPress={() => connectToDevice(device)}
                        disabled={connecting}
                    >
                    <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceIp}>{device.ip}:{device.port}</Text>
                    </View>
                    {connecting && (
                        <ActivityIndicator size="small" color="#0d9488" />
                    )}
                    </TouchableOpacity>
                ))}
                </ScrollView>
            )}

            {/* Manual Connection Option */}
            {/* <View style={styles.footer}>
                <Text style={styles.footerText}>Can't find your device?</Text>
                <TouchableOpacity>
                <Text style={styles.manualConnectText}>Enter IP manually</Text>
                </TouchableOpacity>
            </View> */}
        </View>
    )
}

export default Connect

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#115e59',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  devicesList: {
    flex: 1,
  },
  deviceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  deviceIp: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  manualConnectText: {
    fontSize: 16,
    color: '#0d9488',
    fontWeight: '600',
  },
})
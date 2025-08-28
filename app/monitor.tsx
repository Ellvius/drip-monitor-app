import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- Import from the correct package

const MonitorScreen = () => {
  const params = useLocalSearchParams();
  const { ws, connectionStatus, setConnectionStatus } = useWebSocket();
  
  const [dripRate, setDripRate] = useState<number | null>(null);
  const [isAlert, setIsAlert] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isNormal, setIsNormal] = useState(false);

  const soundObject = useRef<Audio.Sound | null>(null);
  const [soundLoaded, setSoundLoaded] = useState(false);

  // Use a separate useEffect to load and unload the sound file
  useEffect(() => {
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
            staysActiveInBackground: true, 
            shouldDuckAndroid: true // Lower volume of other audio apps when yours is playing
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../assets/alert.wav')
        );
        soundObject.current = sound;
        setSoundLoaded(true);
      } catch (error) {
        console.error('Failed to load sound', error);
      }
    };
    
    loadSound();

    return () => {
      // Unload the sound to free up memory when the component unmounts
      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, []);

  // Use another useEffect to play/stop the sound based on the alert state
  useEffect(() => {
    const playSound = async () => {
      if (soundLoaded && soundObject.current) {
        // We only play if the alert is active
        if (isAlert) {
          await soundObject.current.setIsLoopingAsync(true); // Loop the sound
          await soundObject.current.playAsync();
        } else {
          // If the alert is no longer active, stop the sound and reset
          await soundObject.current.stopAsync();
          await soundObject.current.setPositionAsync(0);
        }
      }
    };
    
    playSound();

  }, [isAlert, soundLoaded]);

  useEffect(() => {
    if (!ws.current) {
      console.log('No WebSocket connection available');
      setConnectionStatus(false);
      return;
    }

    // Check if WebSocket is already connected
    if (ws.current.readyState === WebSocket.OPEN) {
      setConnectionStatus(true);
    }

    const handleMessage = (e: MessageEvent) => {
      const receivedMessage = typeof e.data === 'string' ? e.data : '';
      
      // Check the type of message and update state accordingly
      if (receivedMessage.includes('Drip stopped') || receivedMessage.includes('chamber filled')) {
        setIsAlert(true);
        setIsStopped(true);
        setIsBlocked(false);
        setIsNormal(false);
      } else if (receivedMessage.includes('Drip too fast')) {
        setIsAlert(true);
        setIsStopped(false);
        setIsBlocked(true);
        setIsNormal(false);
      } else {
        setIsAlert(false);
        setIsStopped(false);
        setIsBlocked(false);
        setIsNormal(true);
        
        // Extract drip rate from normal message
        const rateMatch = receivedMessage.match(/(\d+) drops\/min/);
        if (rateMatch) {
          setDripRate(parseInt(rateMatch[1], 10));
        }
      }
    };

    const handleError = (e: Event) => {
      console.log('WebSocket error:', e);
      setConnectionStatus(false);
    };

    const handleClose = (e: CloseEvent) => {
      console.log('WebSocket closed:', e.code, e.reason);
      setConnectionStatus(false);
    };

    // Add event listeners to existing WebSocket
    ws.current.addEventListener('message', handleMessage);
    ws.current.addEventListener('error', handleError);
    ws.current.addEventListener('close', handleClose);

    return () => {
      // Clean up event listeners
      if (ws.current) {
        ws.current.removeEventListener('message', handleMessage);
        ws.current.removeEventListener('error', handleError);
        ws.current.removeEventListener('close', handleClose);
      }
    };
  }, [ws, setConnectionStatus]);

  const getStatusColor = () => {
    switch(connectionStatus) {
      case true: return '#4CAF50';
      case false: return '#F44336';
      default: return '#F44336';
    }
  };

  const getStatusIcon = () => {
    if (isStopped) return '⛔';
    if (isBlocked) return '🚫';
    if (isNormal) return '✅';
    return '❓';
  };

  const getStatusText = () => {
    if (isStopped) return 'DRIP STOPPED';
    if (isBlocked) return 'DRIP BLOCKED';
    if (isNormal) return 'NORMAL DRIP';
    return 'UNKNOWN STATUS';
  };

  const getBackgroundColor = () => {
    if (isAlert) return '#FFEBEE';
    if (isNormal) return '#E8F5E9';
    return '#FFF3E0';
  };

  const getConnectionStatusText = () => {
    return connectionStatus ? 'Connected' : 'Disconnected';
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: getBackgroundColor()}]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Smart Drip Monitor</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusIndicator, {backgroundColor: getStatusColor()}]} />
          <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{params.deviceName}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <Text style={[styles.statusTitle, isAlert && styles.alertText]}>{getStatusText()}</Text>
        </View>
        
        {dripRate && isNormal && (
          <View style={styles.dripRateContainer}>
            <Text style={styles.dripRate}>{dripRate}</Text>
            <Text style={styles.dripRateLabel}>drops per minute</Text>
          </View>
        )}
        
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Monitoring Instructions:</Text>
          <Text style={styles.instructionsText}>
            • Normal drip rate: 20-30 drops/min{'\n'}
            • Blocked drip: More than 30 drops/min{'\n'}
            • Stopped drip: 0 drops/min or chamber full
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Keep the same styles object as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  deviceInfo: {
    marginBottom: 30,
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  alertText: {
    color: '#F44336',
  },
  dripRateContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dripRate: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  dripRateLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  messageContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  instructions: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default MonitorScreen;
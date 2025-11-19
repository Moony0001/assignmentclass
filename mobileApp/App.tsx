import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  StatusBar,
} from 'react-native';
// @ts-ignore
import Beacons from 'react-native-beacons-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import api from './src/api';

// Fix 1: Cast Beacons to 'any' to prevent TypeScript errors on iOS methods
const BeaconsAny = Beacons as any;

interface Campaign {
  campaign_id: string;
  content_title: string;
  content_body: string;
  image_url: string;
  trigger_event_type: string;
  beacon_id: string;
  uuid: string;
  major: number;
  minor: number;
}

interface Beacon {
  uuid: string;
  major: number;
  minor: number;
  distance?: number;
  rssi?: number;
  battery_level?: number;
}

const App = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [detectedBeacons, setDetectedBeacons] = useState<Beacon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // --- MAIN FUNCTION TO CHECK: INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      await requestPermissions();
      await fetchCampaignRules();
      startBeaconScanning();
    };
    init();

    return () => {
      DeviceEventEmitter.removeAllListeners('beaconsDidRange');
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
      } catch (err) {
        console.warn(err);
      }
    } else if (Platform.OS === 'ios') {
      // Fix 1: Using the casted variable to avoid TS error
      BeaconsAny.requestWhenInUseAuthorization();
    }
  };

  const fetchCampaignRules = async () => {
    try {
      setStatus('Fetching campaigns...');
      const response = await api.get('/api/v1/campaigns');
      setCampaigns(response.data);
      await AsyncStorage.setItem('campaigns', JSON.stringify(response.data));
      setStatus(`Loaded ${response.data.length} campaigns.`);
    } catch (error) {
      console.error('API Error', error);
      setStatus('Offline Mode: Using cached rules.');
      const cached = await AsyncStorage.getItem('campaigns');
      if (cached) setCampaigns(JSON.parse(cached));
    }
  };

  // --- MAIN FUNCTION TO CHECK: SCANNING LOGIC ---
  const startBeaconScanning = () => {
    if (Platform.OS === 'android') {
      BeaconsAny.detectIBeacons();
    }

    // Replace with YOUR specific UUID from the Dashboard
    const MY_UUID = 'fda50693-a4e2-4fb1-afcf-c6eb07647825';
    const REGION_ID = 'REGION1';

    try {
      BeaconsAny.startRangingBeaconsInRegion(REGION_ID, MY_UUID)
        .then(() => console.log(`Beacons ranging started for UUID: ${MY_UUID}`))
        .catch((error: any) => console.log(`Beacons ranging failed: ${error}`));
    } catch (err) {
      console.log(`Beacon start error: ${err}`);
    }

    DeviceEventEmitter.addListener('beaconsDidRange', data => {
      if (data && data.beacons && data.beacons.length > 0) {
        setDetectedBeacons(data.beacons);
        handleBeaconDetection(data.beacons[0]);
      }
    });
  };

  const handleBeaconDetection = async (beacon: Beacon) => {
    if (!beacon || !campaigns.length) return;

    const match = campaigns.find(
      c =>
        c.uuid.toLowerCase() === beacon.uuid.toLowerCase() &&
        Number(c.major) === Number(beacon.major) &&
        Number(c.minor) === Number(beacon.minor),
    );

    if (match) {
      triggerNotification(match);
      try {
        await api.post('/api/v1/beacons/telemetry', {
          beacon_id: match.beacon_id,
          battery_level: beacon.battery_level || 100,
        });
      } catch (e) {
        console.log('Telemetry error (ignoring)', e);
      }
    }
  };

  const triggerNotification = async (campaign: Campaign) => {
    const lastSeenKey = `last_seen_${campaign.campaign_id}`;
    const lastSeen = await AsyncStorage.getItem(lastSeenKey);
    const now = Date.now();

    if (!lastSeen || now - parseInt(lastSeen) > 60000) {
      await notifee.displayNotification({
        title: campaign.content_title,
        body: campaign.content_body,
        android: { channelId: 'default' },
      });

      await AsyncStorage.setItem(lastSeenKey, now.toString());

      try {
        await api.post('/api/v1/analytics/event', {
          beacon_id: campaign.beacon_id,
          campaign_id: campaign.campaign_id,
          user_device_id: 'device-123',
          event_type: 'campaign_triggered',
        });
      } catch (e) {
        console.log('Analytics error', e);
      }
    }
  };

  // Fix 2: Use View with padding instead of deprecated SafeAreaView
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>Retail App (Receiver)</Text>

      <View style={styles.statusBox}>
        <Text style={styles.boldText}>Status:</Text>
        <Text>{status}</Text>
      </View>

      <Text style={styles.subHeader}>Nearby Beacons:</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {detectedBeacons.map((b, index) => (
          <View key={index} style={styles.beaconRow}>
            <Text style={styles.text}>UUID: {b.uuid}</Text>
            <Text style={styles.text}>
              Major: {b.major} | Minor: {b.minor}
            </Text>
            <Text style={styles.text}>
              Distance: {b.distance ? b.distance.toFixed(2) : 'Unknown'}m
            </Text>
          </View>
        ))}
        {detectedBeacons.length === 0 && <Text>Scanning for beacons...</Text>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 20 : 60, // Top padding for status bar
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusBox: {
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  beaconRow: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    color: '#333',
    marginBottom: 2,
  },
});

export default App;

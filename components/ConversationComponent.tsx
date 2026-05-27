'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useIsConnected,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import { MicrophoneButton } from './MicrophoneButton';
import { AudioVisualizer } from './AudioVisualizer';
import type {
  ConversationComponentProps,
  StopConversationRequest,
  ClientStartRequest,
} from '@/types/conversation';
import ConvoTextStream from './ConvoTextStream';
import {
  MessageEngine,
  IMessageListItem,
  EMessageStatus,
  EMessageEngineMode,
} from '@/lib/message';

// Export EMessageStatus for use in other components
export { EMessageStatus } from '@/lib/message';

const MESSAGE_BUFFER: { [key: string]: string } = {};

export default function ConversationComponent({
  agoraData,
  onTokenWillExpire,
  onEndConversation,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isEnabled);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const agentUID = process.env.NEXT_PUBLIC_AGENT_UID;
  // Track the real numeric UID assigned by Agora to the agent
  const [detectedAgentUID, setDetectedAgentUID] = useState<string | null>(null);
  const [joinedUID, setJoinedUID] = useState<UID>(0);
  const [messageList, setMessageList] = useState<IMessageListItem[]>([]);
  const [currentInProgressMessage, setCurrentInProgressMessage] =
    useState<IMessageListItem | null>(null);
  const messageEngineRef = useRef<MessageEngine | null>(null);
  // Ref mirrors detectedAgentUID so stream-message handler never has a stale closure
  const detectedAgentUIDRef = useRef<string | null>(null);
  // Track already-processed message IDs to prevent duplicate handling
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Check if agent UID is properly set
  useEffect(() => {
    if (!agentUID) {
      console.warn('NEXT_PUBLIC_AGENT_UID environment variable is not set');
    } else {
      console.log('Agent UID is set to:', agentUID);
    }
  }, [agentUID]);

  // Join the channel using the useJoin hook
  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid),
    },
    true
  );

  // Initialize MessageEngine when client is ready and connected
  useEffect(() => {
    // Only initialize when the client is connected
    if (!client || !isConnected) return;

    // First, clean up any existing instance
    if (messageEngineRef.current) {
      console.log('Cleaning up existing MessageEngine instance');
      try {
        messageEngineRef.current.teardownInterval();
        messageEngineRef.current.cleanup();
      } catch (err) {
        console.error('Error cleaning up MessageEngine:', err);
      }
      messageEngineRef.current = null;
    }

    console.log('Creating new MessageEngine instance with connected client');

    // Create message engine with TEXT mode for better compatibility
    try {
      const messageEngine = new MessageEngine(
        client,
        EMessageEngineMode.TEXT, // Use TEXT mode for more reliable message handling
        // Callback to handle message list updates
        (updatedMessages: IMessageListItem[]) => {
          console.log('MessageEngine update:', updatedMessages);

          // Sort messages by turn_id to maintain order
          const sortedMessages = [...updatedMessages].sort(
            (a, b) => a.turn_id - b.turn_id
          );

          // Find the latest in-progress message
          const inProgressMsg = sortedMessages.find(
            (msg) => msg.status === EMessageStatus.IN_PROGRESS
          );

          // Update states
          setMessageList(
            sortedMessages.filter(
              (msg) => msg.status !== EMessageStatus.IN_PROGRESS
            )
          );
          setCurrentInProgressMessage(inProgressMsg || null);
        }
      );

      messageEngineRef.current = messageEngine;

      // Start the MessageEngine after client is connected
      console.log('Starting MessageEngine...');
      messageEngineRef.current.run({ legacyMode: false });
      console.log('MessageEngine successfully initialized and running');
    } catch (error) {
      console.error('Failed to initialize MessageEngine:', error);
    }

    // Cleanup on state change
    return () => {
      if (messageEngineRef.current) {
        console.log('Cleaning up MessageEngine on state change');
        try {
          messageEngineRef.current.teardownInterval();
          messageEngineRef.current.cleanup();
        } catch (err) {
          console.error('Error cleaning up MessageEngine:', err);
        }
        messageEngineRef.current = null;
      }
    };
  }, [client, agentUID, isConnected]); // Add isConnected dependency

  // Keep ref in sync with state
  useEffect(() => {
    detectedAgentUIDRef.current = detectedAgentUID;
  }, [detectedAgentUID]);

  // Stream message handler — use ref to avoid stale closures on re-render
  useClientEvent(client, 'stream-message', (uid, payload) => {
    const uidStr = uid.toString();
    const currentAgentUID = detectedAgentUIDRef.current;
    const isAgentMessage =
      (currentAgentUID !== null && uidStr === currentAgentUID) ||
      uidStr === agentUID;

    if (!isAgentMessage) return;
    if (!messageEngineRef.current) return;

    // Parse message_id to deduplicate — Agora sometimes fires the event twice
    try {
      const decoded = new TextDecoder().decode(payload);
      const parsed = JSON.parse(decoded);
      const msgId = parsed?.message_id;
      if (msgId) {
        if (processedMessageIds.current.has(msgId)) return; // already handled
        processedMessageIds.current.add(msgId);
        // Clean up old IDs to avoid unbounded growth
        if (processedMessageIds.current.size > 200) {
          const oldest = [...processedMessageIds.current].slice(0, 100);
          oldest.forEach(id => processedMessageIds.current.delete(id));
        }
      }
    } catch {
      // non-JSON payload — let it through
    }

    try {
      messageEngineRef.current.handleStreamMessage(payload);
    } catch (error) {
      console.error('Error processing stream message:', error);
      setTimeout(() => {
        try { messageEngineRef.current?.run({ legacyMode: false }); } catch {}
      }, 50);
    }
  });

  // Update actualUID when join is successful
  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      setJoinedUID(uid as UID);
      console.log('Join successful, using UID:', uid);
    }
  }, [joinSuccess, client]);

  // Publish local microphone track
  usePublish([localMicrophoneTrack]);

  // Ensure local track is enabled for testing
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(true);
    }
  }, [localMicrophoneTrack]);

  // Handle remote user events — auto-detect agent UID on first join
  useClientEvent(client, 'user-joined', (user) => {
    const uid = user.uid.toString();
    console.log('Remote user joined:', uid);
    // Any remote user joining is the agent (single-user convo channel)
    setDetectedAgentUID(uid);
    setIsAgentConnected(true);
    setIsConnecting(false);
    console.log('✅ Agent detected with UID:', uid);
  });

  useClientEvent(client, 'user-left', (user) => {
    const uid = user.uid.toString();
    console.log('Remote user left:', uid);
    if (uid === detectedAgentUID) {
      setIsAgentConnected(false);
      setIsConnecting(false);
      setDetectedAgentUID(null);
    }
  });

  // Sync isAgentConnected with remoteUsers
  useEffect(() => {
    if (remoteUsers.length > 0) {
      const firstAgent = remoteUsers[0].uid.toString();
      if (!detectedAgentUID) setDetectedAgentUID(firstAgent);
      setIsAgentConnected(true);
    } else {
      setIsAgentConnected(false);
    }
  }, [remoteUsers]);

  // Connection state changes
  useClientEvent(client, 'connection-state-change', (curState, prevState) => {
    console.log(`Connection state changed from ${prevState} to ${curState}`);

    if (curState === 'DISCONNECTED') {
      console.log('Attempting to reconnect...');
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      client?.leave();
    };
  }, [client]);

  // Handle conversation actions
  const handleStopConversation = async () => {
    try {
      const stopRequest: StopConversationRequest = {
        agent_id: agoraData.agentId!,
      };

      const response = await fetch('/api/stop-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stopRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to stop conversation: ${response.statusText}`);
      }

      setIsAgentConnected(false);
      if (onEndConversation) {
        onEndConversation();
      }
    } catch (error) {
      console.error('Error stopping conversation:', error);
    }
  };

  const handleStartConversation = async () => {
    if (!agoraData.agentId) return;
    setIsConnecting(true);

    try {
      const startRequest: ClientStartRequest = {
        requester_id: joinedUID?.toString(),
        channel_name: agoraData.channel,
        input_modalities: ['text'],
        output_modalities: ['text', 'audio'],
      };

      const response = await fetch('/api/invite-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(startRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`);
      }

      // Update agent ID when new agent is connected
      const data = await response.json();
      if (data.agent_id) {
        agoraData.agentId = data.agent_id;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn('Error starting conversation:', error.message);
      }
      // Reset connecting state if there's an error
      setIsConnecting(false);
    }
  };

  // Toggle microphone functionality
  const handleMicrophoneToggle = async (isOn: boolean) => {
    setIsEnabled(isOn);

    if (isOn && !isAgentConnected) {
      // Start conversation when microphone is turned on
      await handleStartConversation();
    }
  };

  // Add token renewal handler
  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      const newToken = await onTokenWillExpire(joinedUID.toString());
      await client?.renewToken(newToken);
      console.log('Successfully renewed Agora token');
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, joinedUID]);

  // Add token observer
  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);

  // Explicitly subscribe to agent audio when they publish
  useClientEvent(client, 'user-published', async (user, mediaType) => {
    console.log(`Remote user ${user.uid} published ${mediaType}`);
    try {
      await client.subscribe(user, mediaType);
      console.log(`✅ Subscribed to agent ${mediaType} track`);
    } catch (err) {
      console.error(`Failed to subscribe to ${mediaType}:`, err);
    }
  });

  return (
    <div className="flex flex-col gap-6 p-4 h-full">
      {/* Connection Status - Updated to show connecting state */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isAgentConnected ? (
          <button
            onClick={handleStopConversation}
            disabled={isConnecting}
            className="px-4 py-2 bg-red-500/80 text-white rounded-full border border-red-400/30 backdrop-blur-sm 
            hover:bg-red-600/90 transition-all shadow-lg hover:shadow-red-500/20 
            disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isConnecting ? 'Disconnecting...' : 'Stop Agent'}
          </button>
        ) : (
          remoteUsers.length === 0 && (
            <button
              onClick={handleStartConversation}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-500/80 text-white rounded-full border border-blue-400/30 backdrop-blur-sm 
              hover:bg-blue-600/90 transition-all shadow-lg hover:shadow-blue-500/20 
              disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isConnecting ? 'Connecting with agent...' : 'Connect Agent'}
            </button>
          )
        )}
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          onClick={onEndConversation}
          role="button"
          title="End conversation"
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Remote Users Section - Moved to top */}
      <div className="flex-1">
        {remoteUsers.map((user) => (
          <div key={user.uid}>
            <AudioVisualizer track={user.audioTrack} />
            <RemoteUser user={user} />
          </div>
        ))}

        {remoteUsers.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Waiting for AI agent to join...
          </div>
        )}
      </div>

      {/* Local Controls - Fixed at bottom center */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <MicrophoneButton
          isEnabled={isEnabled}
          setIsEnabled={setIsEnabled}
          localMicrophoneTrack={localMicrophoneTrack}
        />
      </div>

      {/* Conversation Text Stream component */}
      <ConvoTextStream
        messageList={messageList}
        currentInProgressMessage={currentInProgressMessage}
        agentUID={detectedAgentUID ?? agentUID}
      />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { IoArrowUp } from 'react-icons/io5';
import { MdOutlineSmartToy } from 'react-icons/md';
import { showAlert } from '../components/dialogs';
import type { Navigation } from '../navigation';
import { respond } from '../services/advocate';
import * as store from '../services/store';

interface Message {
  id: number;
  from: 'ai' | 'user';
  text: string;
  createdAt: number;
}

const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ChatAdvocate({ navigation }: { navigation: Navigation }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const nextId = useRef(2);
  const customerTexts = useRef<string[]>([]);
  const questionsAsked = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        from: 'ai',
        text: 'Hi Ahmad! I am your DanaFlow AI Advocate. I see you want to file a claim. Can you briefly describe what happened to your car?',
        createdAt: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages, isTyping]);

  const append = (from: Message['from'], text: string) =>
    setMessages((previous) => [...previous, { id: nextId.current++, from, text, createdAt: Date.now() }]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || isTyping) return;
    setDraft('');
    append('user', text);
    setIsTyping(true);
    customerTexts.current.push(text);

    try {
      await sleep(900 + Math.random() * 700);
      const result = respond(customerTexts.current, questionsAsked.current);

      if (result.functionCall) {
        // The agent took action: update the customer's latest claim
        const { reason } = result.functionCall.args;
        store.log('AI', `functionCall update_claim_status({ reason: "${reason.slice(0, 60)}..." })`);

        const latest = store.latestClaim();
        if (latest) {
          store.updateClaim(latest.id, { status: 'AI Reviewing', aiSummary: reason });
          store.log('FIRESTORE', `claims/${latest.id.slice(0, 6)}... status -> AI Reviewing`);
          showAlert(
            'Database Updated By AI',
            `AI Summary: ${reason}\n\nFirestore status successfully changed to 'AI Reviewing'.`,
          );
          append(
            'ai',
            "I have recorded the details and updated your claim status to 'AI Reviewing'. Our human adjusters will take it from here. Thank you!",
          );
          customerTexts.current = [];
          questionsAsked.current = 0;
        } else {
          append(
            'ai',
            "I have the details of what happened, but I can't find a filed claim to attach them to. Please submit a claim from the Claims tab first, then message me again.",
          );
        }
      } else if (result.text) {
        questionsAsked.current += 1;
        append('ai', result.text);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="screen chat">
      <div className="chat-header">
        <button type="button" className="back-button" aria-label="Back" onClick={() => navigation.goBack()}>‹</button>
        <div className="header-center">
          <div className="ai-avatar">AI</div>
          <div>
            <div className="header-title">DanaFlow Advocate</div>
            <div className="online-row">
              <span className="online-dot" />
              <span className="online-text">Online · Scripted demo assistant</span>
            </div>
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`msg ${message.from}`}>
            {message.from === 'ai' && (
              <div className="msg-avatar">
                <MdOutlineSmartToy size={20} />
              </div>
            )}
            <div className="bubble">
              {message.text}
              <time>{formatTime(message.createdAt)}</time>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="msg ai">
            <div className="msg-avatar">
              <MdOutlineSmartToy size={20} />
            </div>
            <div className="bubble" aria-label="The advocate is typing">
              <span className="typing"><i /><i /><i /></span>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <form
        className="input-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          void onSend();
        }}
      >
        <input
          type="text"
          placeholder="Describe your claim…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Message"
        />
        <button type="submit" className="send-button" aria-label="Send" disabled={!draft.trim() || isTyping}>
          <IoArrowUp size={20} />
        </button>
      </form>
    </div>
  );
}

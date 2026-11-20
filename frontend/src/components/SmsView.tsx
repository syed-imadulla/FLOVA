import { useState } from "react";
import { api } from "../api";

interface Msg { from: "me" | "flova"; text: string }

/** Simulates a keypad phone talking to POST /sms. */
export function SmsView({ defaultPhone }: { defaultPhone: string }) {
  const [phone, setPhone] = useState(defaultPhone);
  const [text, setText] = useState("");
  const [log, setLog] = useState<Msg[]>([]);

  async function send(t: string) {
    if (!t.trim()) return;
    setLog((l) => [...l, { from: "me", text: t }]);
    setText("");
    try {
      const { reply } = await api.sms(phone, t);
      setLog((l) => [...l, { from: "flova", text: reply }]);
    } catch (e) {
      setLog((l) => [...l, { from: "flova", text: `(error: ${(e as Error).message})` }]);
    }
  }

  return (
    <section className="grid2">
      <div className="card">
        <h2>Keypad-phone mode</h2>
        <p className="muted">
          For riders without a smartphone: one SMS a week. Sign up a rider with a phone number on the
          "My week" tab, then send messages from that number here.
        </p>
        <ul>
          <li><code>PAY 5200</code>: log this week's payout</li>
          <li><code>STATUS</code>: get salary and buffer</li>
          <li><code>UNDO</code>: remove the last entry</li>
        </ul>
        <label>From number<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      </div>
      <div className="phone">
        <div className="screen">
          {log.length === 0 && <p className="muted center">No messages yet</p>}
          {log.map((m, i) => <div key={i} className={`bubble ${m.from}`}>{m.text}</div>)}
        </div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input value={text} maxLength={160} placeholder="PAY 5200" onChange={(e) => setText(e.target.value)} />
          <button>Send</button>
        </form>
        <div className="row">
          {["PAY 5200", "STATUS", "UNDO"].map((q) => (
            <button key={q} type="button" className="secondary" onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

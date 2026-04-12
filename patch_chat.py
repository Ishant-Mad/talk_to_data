import re

with open("frontend/pages/index.tsx", "r") as f:
    content = f.read()

new_block = """                      <div className="chat-body" style={{ border: "none", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <div className="split-screen__scroll-area" style={{ padding: "0 8px 16px 0", flex: 1, overflowY: "auto" }}>
                          {chatHistory.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                              {chatHistory.map((interaction) => (
                                <div key={interaction.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {interaction.role === "user" ? (
                                    <div style={{ alignSelf: "flex-end", background: "var(--fill)", color: "#fff", padding: "10px 14px", borderRadius: "14px 14px 2px 14px", maxWidth: "85%", fontSize: "0.95rem" }}>
                                      {interaction.text}
                                    </div>
                                  ) : (
                                    <div style={{ alignSelf: "flex-start", background: "var(--bg-panel)", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: "14px 14px 14px 2px", maxWidth: "95%" }}>
                                      {interaction.loading ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                                          <span className="pulse-loader" style={{margin: 0}}></span>
                                          <span style={{ fontSize: "0.9rem" }}>Analyzing...</span>
                                        </div>
                                      ) : interaction.error ? (
                                        <div style={{ color: "#ef4444", fontSize: "0.9rem" }}>{interaction.error}</div>
                                      ) : interaction.response ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                          <details style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 12px" }}>
                                            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>View Reasoning Steps</summary>
                                            <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                                              {interaction.response.reasoning_steps?.join("\\n")}
                                            </div>
                                          </details>

                                          {interaction.response.analyses?.map((analysis, idx) => (
                                            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                              <div style={{ fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", color: "var(--accent)" }}>
                                                {analysis.type}
                                              </div>
                                              <div style={{ fontSize: "0.95rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                                                {analysis.insight}
                                              </div>
                                              {analysis.chart && analysis.chart.data?.length > 0 && (
                                                <div style={{ height: "200px", marginTop: "8px" }}>
                                                  <ChartViz chart={analysis.chart} />
                                                </div>
                                              )}
                                            </div>
                                          ))}

                                          <div style={{ display: "flex", flexWrap: "wrap", columnGap: "12px", rowGap: "4px", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
                                            <div className="chat-meta" style={{ margin: 0 }}>Confidence · {interaction.response.confidence}</div>
                                            {interaction.response.data_source && (
                                              <div className="chat-meta chat-meta--tight" style={{ margin: 0 }}>
                                                Provenance · <a href="#!" onClick={(e) => {
                                                  e.preventDefault();
                                                  setActiveRightTab("signals");
                                                  setTimeout(() => {
                                                    window.dispatchEvent(new CustomEvent("focus-chart", {
                                                      detail: { table: interaction.response!.data_source }
                                                    }));
                                                  }, 100);
                                                }} style={{ color: "var(--accent)", textDecoration: "underline", cursor: "pointer" }}>{interaction.response.data_source}</a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="chat-message" style={{ textAlign: "center", marginTop: "40px", opacity: 0.7 }}>
                              Submit a question to receive a structured answer. Figures are computed from your CSVs.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="chat-input" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", flexShrink: 0 }}>
                        <input
                          type="text"
                          placeholder="e.g. Sum volume by region for Q1"
                          value={question}
                          disabled={chatLoading}
                          onChange={(event) => setQuestion(event.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !chatLoading && question.trim()) {
                              e.preventDefault();
                              document.getElementById('ttd-btn-execute')?.click();
                            }
                          }}
                        />
                        <button
                          id="ttd-btn-execute"
                          type="button"
                          disabled={chatLoading || !question.trim()}
                          onClick={async () => {
                            const newQ = question.trim();
                            if (!newQ) return;
                            const newId = Date.now().toString();
                            
                            // Extract history payload for backend
                            const historyPayload = chatHistory
                              .filter(m => !m.loading && !m.error)
                              .map(m => ({ 
                                role: m.role, 
                                content: m.role === "user" ? m.text : (m.response?.analyses?.map((a: any) => a.insight).join(" ") || "") 
                              }));

                            setChatHistory(prev => [
                              ...prev,
                              { id: `${newId}-u`, role: "user", text: newQ },
                              { id: `${newId}-a`, role: "assistant", loading: true }
                            ]);
                            setQuestion("");
                            setChatLoading(true);
                            setChatError(null);
                            
                            setTimeout(() => {
                              const scroller = document.querySelector(".chat-body .split-screen__scroll-area");
                              if (scroller) scroller.scrollTop = scroller.scrollHeight;
                            }, 50);

                            try {
                              const response = await fetch(`${apiBase}/chat`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ question: newQ, history: historyPayload }),
                              });
                              if (!response.ok) throw new Error(await readApiError(response));
                              const payload = (await response.json());
                              if (!payload?.analyses) throw new Error("Agent response was incomplete.");
                              
                              setChatHistory(prev => prev.map(msg => 
                                msg.id === `${newId}-a` 
                                  ? { ...msg, loading: false, response: payload } 
                                  : msg
                              ));
                            } catch (error) {
                              const errorMsg = error instanceof Error ? error.message : "Could not reach the data agent right now.";
                              setChatHistory(prev => prev.map(msg => 
                                msg.id === `${newId}-a` 
                                  ? { ...msg, loading: false, error: errorMsg } 
                                  : msg
                              ));
                              setChatError(errorMsg);
                            } finally {
                              setChatLoading(false);
                              setTimeout(() => {
                                const scroller = document.querySelector(".chat-body .split-screen__scroll-area");
                                if (scroller) scroller.scrollTop = scroller.scrollHeight;
                              }, 100);
                            }
                          }}
                        >
                          {chatLoading ? "Running…" : "Execute"}
                        </button>
                      </div>"""

pattern = re.compile(r'<div className="chat-body" style={{ border: "none" }}>.*?</div>\s*<div className="chat-input" style={{ borderTop: "1px solid var\(--border\)", paddingTop: "16px" }}>.*?</button>\s*</div>', re.DOTALL)
new_content = pattern.sub(new_block, content)

with open("frontend/pages/index.tsx", "w") as f:
    f.write(new_content)

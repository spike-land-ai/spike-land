import { Hono } from "hono";
import { html } from "hono/html";
import { Env } from "../../core-logic/env";

export const embedRouter = new Hono<{ Bindings: Env }>();

embedRouter.get("/:workspace/:channel", (c) => {
  const workspace = c.req.param("workspace");
  const channel = c.req.param("channel");
  
  return c.html(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Spike Chat - ${channel}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: transparent; }
      </style>
    </head>
    <body class="flex flex-col h-screen text-slate-100 bg-slate-900/90">
      <div class="flex-1 overflow-y-auto p-4 space-y-4" id="messages">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">Z</div>
          <div>
            <div class="flex items-baseline gap-2">
              <span class="font-semibold text-sm">Zoltan</span>
              <span class="text-xs text-slate-400">Just now</span>
            </div>
            <p class="text-sm mt-1 text-slate-300">Welcome to the Universal Interface. This is a live, real-time channel. Say hello!</p>
          </div>
        </div>
      </div>
      
      <form id="chat-form" class="p-3 border-t border-slate-800 flex gap-2">
        <input 
          type="text" 
          id="message-input"
          placeholder="Type a message as a guest..." 
          class="flex-1 bg-slate-800 text-sm rounded-full px-4 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200"
          required
        />
        <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors">
          Send
        </button>
      </form>

      <script>
        const form = document.getElementById('chat-form');
        const input = document.getElementById('message-input');
        const messages = document.getElementById('messages');

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const text = input.value.trim();
          if (!text) return;
          
          const msgHtml = \`
            <div class="flex items-start gap-3 animate-fade-in">
              <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">G</div>
              <div>
                <div class="flex items-baseline gap-2">
                  <span class="font-semibold text-sm">Visitor</span>
                  <span class="text-xs text-slate-400">Just now</span>
                </div>
                <p class="text-sm mt-1 text-slate-300">\${text}</p>
              </div>
            </div>
          \`;
          
          messages.insertAdjacentHTML('beforeend', msgHtml);
          messages.scrollTop = messages.scrollHeight;
          input.value = '';
        });
      </script>
    </body>
    </html>
  `);
});

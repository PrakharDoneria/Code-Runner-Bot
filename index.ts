import { Bot, InlineKeyboard, webhookCallback } from "https://deno.land/x/grammy@v1.30.0/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in the environment variables");
}

const bot = new Bot(botToken);
const url = "https://emkc.org/api/v2/piston/execute";

async function runCode(sourceCode: string, language: string, version: string) {
  try {
    const payload = {
      language,
      version,
      files: [{ content: sourceCode }],
      args: [],
      stdin: "",
      log: 0,
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return await response.json();
    } else {
      return { error: `Request failed with status code ${response.status}` };
    }
  } catch (error) {
    console.error("Error running code:", error);
    return { error: "An error occurred while running the code." };
  }
}

async function handleCodeCommand(ctx: any, language: string, version: string) {
  const chatId = ctx.chat.id;
  let code = "";
  const onMessage = (message: string) => {
    if (message === "") {
      return;
    }
    code += message + "\n";
  };
  bot.on("message:text", (messageCtx: any) => {
    if (messageCtx.chat.id === chatId) {
      onMessage(messageCtx.message.text);
    }
  });
  try {
    await ctx.api.sendChatAction(chatId, "typing");
    await ctx.api.sendMessage(chatId, `Please send your ${language} code line by line. Send an empty message when you're done.`);
    setTimeout(async () => {
      try {
        const result = await runCode(code.trim(), language, version);
        const output = result.run?.output || `Error: ${result.error}`;
        await ctx.api.sendMessage(chatId, output);
      } catch (error) {
        console.error("Error sending result:", error);
        await ctx.api.sendMessage(chatId, "An error occurred while sending the result.");
      }
    }, 60000);
  } catch (error) {
    console.error("Error handling code command:", error);
    await ctx.api.sendMessage(chatId, "An error occurred while processing your code.");
  }
}

bot.command("start", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    await ctx.api.sendMessage(chatId, "Welcome to the code execution bot! Use the following commands to run your code:\n\n/start - Get a welcome message and list of commands\n/help - Get help on how to use the bot\n/languages - List available languages and their commands\n/donate - Support the bot");
  } catch (error) {
    console.error("Error handling /start command:", error);
    await ctx.api.sendMessage(ctx.chat.id, "An error occurred while processing your request.");
  }
});

bot.command("help", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    await ctx.api.sendMessage(chatId, "This bot allows you to execute code in various programming languages.\n\nTo use it, send a command followed by your code. For example:\n/python\n<your code here>\n\nCommands:\n/start - Get a welcome message and list of commands\n/help - Get help on how to use the bot\n/languages - List available languages and their commands\n/donate - Support the bot");
  } catch (error) {
    console.error("Error handling /help command:", error);
    await ctx.api.sendMessage(ctx.chat.id, "An error occurred while processing your request.");
  }
});

bot.command("languages", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    await ctx.api.sendMessage(chatId, "Available languages:\n\nPython - /python\nDart - /dart\nJavaScript - /javascript\nC# - /csharp\nJava - /java\nKotlin - /kotlin\nLua - /lua\nPHP - /php\nPerl - /perl\nRuby - /ruby\nRust - /rust\nSwift - /swift\nSQLite3 - /sqlite3\n/donate - Support the bot");
  } catch (error) {
    console.error("Error handling /languages command:", error);
    await ctx.api.sendMessage(ctx.chat.id, "An error occurred while processing your request.");
  }
});

bot.command("donate", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const keyboard = new InlineKeyboard().add({ text: "Donate via PayPal", url: "https://paypal.me/prakhardoneria" }, { text: "Buy Me a Coffee", url: "https://www.buymeacoffee.com/prakhardoneria.in" });
    await ctx.api.sendMessage(chatId, "If you appreciate this bot and want to support its development, you can donate via the following options:", { reply_markup: keyboard });
  } catch (error) {
    console.error("Error handling /donate command:", error);
    await ctx.api.sendMessage(ctx.chat.id, "An error occurred while processing your request.");
  }
});

bot.command("python", (ctx) => handleCodeCommand(ctx, "python", "3.10.0"));
bot.command("dart", (ctx) => handleCodeCommand(ctx, "dart", "2.19.6"));
bot.command("javascript", (ctx) => handleCodeCommand(ctx, "javascript", "1.32.3"));
bot.command("csharp", (ctx) => handleCodeCommand(ctx, "csharp", "6.12.0"));
bot.command("java", (ctx) => handleCodeCommand(ctx, "java", "15.0.2"));
bot.command("kotlin", (ctx) => handleCodeCommand(ctx, "kotlin", "1.8.20"));
bot.command("lua", (ctx) => handleCodeCommand(ctx, "lua", "5.4.4"));
bot.command("php", (ctx) => handleCodeCommand(ctx, "php", "8.2.3"));
bot.command("perl", (ctx) => handleCodeCommand(ctx, "perl", "5.36.0"));
bot.command("ruby", (ctx) => handleCodeCommand(ctx, "ruby", "3.0.1"));
bot.command("rust", (ctx) => handleCodeCommand(ctx, "rust", "1.68.2"));
bot.command("swift", (ctx) => handleCodeCommand(ctx, "swift", "5.3.3"));
bot.command("sqlite3", (ctx) => handleCodeCommand(ctx, "sqlite3", "3.36.0"));

const handleUpdate = webhookCallback(bot, "std/http");

serve(async (req) => {
  if (req.method === "POST") {
    const url = new URL(req.url);
    if (url.pathname.slice(1) === botToken) {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error("Error handling update:", err);
      }
    }
  }
  return new Response();
});

try {
  const webhookUrl = `https://coderunner.deno.dev/${botToken}`;
  await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
  console.log("Webhook set successfully.");
} catch (error) {
  console.error("Error setting webhook:", error);
}

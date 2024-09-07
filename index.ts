import { Bot, InlineKeyboard } from "https://deno.land/x/grammy@v1.30.0/mod.ts";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
if (!botToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in the environment variables");
}

const bot = new Bot(botToken);
const url = "https://emkc.org/api/v2/piston/execute";

async function runCode(sourceCode: string, language: string, version: string) {
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
}

async function handleCodeCommand(ctx: any, language: string, version: string) {
  const userId = ctx.message.from.id;
  let code = "";

  const onMessage = (message: string) => {
    if (message === "") {
      return;
    }
    code += message + "\n";
  };

  bot.on("message:text", (messageCtx: any) => {
    if (messageCtx.message.from.id === userId) {
      onMessage(messageCtx.message.text);
    }
  });

  await ctx.api.sendChatAction(userId, "typing");
  await ctx.api.sendMessage(userId, `Please send your ${language} code line by line. Send an empty message when you're done.`);

  setTimeout(async () => {
    const result = await runCode(code.trim(), language, version);
    const output = result.run?.output || `Error: ${result.error}`;
    await ctx.api.sendMessage(userId, output);
  }, 60000);
}

bot.command("start", async (ctx) => {
  await ctx.api.sendMessage(ctx.message.from.id, 
    "Welcome to the code execution bot! Use the following commands to run your code:\n\n" +
    "/python - Run Python code\n" +
    "/dart - Run Dart code\n" +
    "/javascript - Run JavaScript code\n" +
    "/csharp - Run C# code\n" +
    "/java - Run Java code\n" +
    "/kotlin - Run Kotlin code\n" +
    "/lua - Run Lua code\n" +
    "/php - Run PHP code\n" +
    "/perl - Run Perl code\n" +
    "/ruby - Run Ruby code\n" +
    "/rust - Run Rust code\n" +
    "/swift - Run Swift code\n" +
    "/sqlite3 - Run SQLite3 code\n" +
    "/languages - List available languages\n" +
    "/donate - Support the bot"
  );
});

bot.command("help", async (ctx) => {
  await ctx.api.sendMessage(ctx.message.from.id, 
    "This bot allows you to execute code in various programming languages.\n\n" +
    "To use it, send a command followed by your code. For example:\n" +
    "/python\n<your code here>\n\n" +
    "Commands:\n" +
    "/start - Get a welcome message and list of commands\n" +
    "/help - Get help on how to use the bot\n" +
    "/languages - List available languages and their commands\n" +
    "/donate - Support the bot"
  );
});

bot.command("languages", async (ctx) => {
  await ctx.api.sendMessage(ctx.message.from.id, 
    "Available languages:\n\n" +
    "Python - /python\n" +
    "Dart - /dart\n" +
    "JavaScript - /javascript\n" +
    "C# - /csharp\n" +
    "Java - /java\n" +
    "Kotlin - /kotlin\n" +
    "Lua - /lua\n" +
    "PHP - /php\n" +
    "Perl - /perl\n" +
    "Ruby - /ruby\n" +
    "Rust - /rust\n" +
    "Swift - /swift\n" +
    "SQLite3 - /sqlite3\n" +
    "/donate - Support the bot"
  );
});

bot.command("donate", async (ctx) => {
  const userId = ctx.message.from.id;
  const keyboard = new InlineKeyboard()
    .add(
      { text: "Donate via PayPal", url: "https://paypal.me/prakhardoneria" },
      { text: "Buy Me a Coffee", url: "https://www.buymeacoffee.com/prakhardoneria.in" }
    );

  await ctx.api.sendMessage(userId, 
    "If you appreciate this bot and want to support its development, you can donate via the following options:",
    { reply_markup: keyboard }
  );
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

bot.start();

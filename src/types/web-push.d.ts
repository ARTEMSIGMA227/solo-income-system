declare module "web-push" {
  interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  function generateVAPIDKeys(): VapidKeys;

  function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer | null,
    options?: Record<string, unknown>
  ): Promise<SendResult>;

  export default {
    generateVAPIDKeys,
    setVapidDetails,
    sendNotification,
  };

  export { generateVAPIDKeys, setVapidDetails, sendNotification };
}
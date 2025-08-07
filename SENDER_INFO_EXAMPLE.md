# Sender Information Feature - Example Configuration

## ✅ **Feature Successfully Added!**

The email history dashboard now shows **which email address was used to send each email**.

## **What You'll See:**

### **In the Dashboard:**
- **Recipient Column**: Shows who received the email
- **Sender Column**: Shows which email account sent it
  - **Email**: The actual sender email (e.g., user1@gmail.com)
  - **Name**: The sender's display name (e.g., "Marketing Team")

### **Database Storage:**
Each email now stores:
```json
{
  "recipient": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "sender": {
    "email": "user1@gmail.com",
    "name": "Marketing Team", 
    "userId": "user_1"
  },
  "subject": "Welcome!",
  "status": "sent"
}
```

## **Multiple Users Configuration Example:**

### **Option 1: Simple Format**
```bash
# In docker.env
SMTP_USERS=["user1@gmail.com:apppassword1:Marketing Team","user2@gmail.com:apppassword2:Support Team","user3@gmail.com:apppassword3:Sales Team"]
```

### **Option 2: Detailed Format**
```bash
# In docker.env
SMTP_USERS=[
  {
    "email": "marketing@company.com",
    "password": "apppassword1", 
    "name": "Marketing Team"
  },
  {
    "email": "support@company.com",
    "password": "apppassword2",
    "name": "Support Team" 
  },
  {
    "email": "sales@company.com",
    "password": "apppassword3",
    "name": "Sales Team"
  }
]
```

## **How It Works:**

1. **Random Selection**: Each email randomly picks one of your configured users
2. **Load Distribution**: Spreads emails across multiple accounts
3. **Dashboard Tracking**: Shows exactly which account sent each email
4. **API Access**: Full user management through `/api/users` endpoints

## **Testing:**

1. **Configure multiple users** in `docker.env`
2. **Restart services**: `docker-compose up -d backend worker`
3. **Send emails** - each will use a random sender
4. **Check dashboard** - you'll see different sender emails
5. **View logs** - shows which user was selected for each email

## **Dashboard Preview:**

```
Recipient              | Sender                     | Subject    | Status | Sent At
----------------------|----------------------------|------------|--------|----------
customer1@email.com   | marketing@company.com      | Welcome!   | sent   | 2025-08-07
                      | Marketing Team             |            |        |
customer2@email.com   | support@company.com        | Help Info  | sent   | 2025-08-07  
                      | Support Team               |            |        |
customer3@email.com   | sales@company.com          | Special    | sent   | 2025-08-07
                      | Sales Team                 |            |        |
```

The sender information helps you:
- **Track which accounts are being used**
- **Debug email delivery issues**
- **Monitor account usage and limits**
- **Maintain professional sender names**

**All existing emails will show sender info for new sends after this update!** 🎉

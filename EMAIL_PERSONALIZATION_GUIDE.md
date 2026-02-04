# Email Personalization Guide

## Overview
Emails sent from the admin panel are now sent individually to each recipient to maintain privacy (BCC style). Each email can be personalized with the recipient's information.

## Privacy Feature
- **Individual Emails**: Each recipient receives a separate email
- **No Shared Recipients**: Recipients cannot see who else received the email
- **Previous Issue**: Emails were sent with all recipients in the "To" field (CC style)
- **Current Behavior**: Each email is sent individually, similar to BCC

## Personalization Placeholders

You can use the following placeholders in your email subject or message. They will be automatically replaced with each recipient's information:

| Placeholder | Description | Example |
|------------|-------------|---------|
| `{{name}}` | Recipient's full name | "John Doe" |
| `{{email}}` | Recipient's email address | "john@example.com" |
| `{{reg_no}}` | Recipient's registration number | "REG2024001" |

## Usage Examples

### Example 1: Simple Greeting
**Message:**
```
Hello {{name}},

Welcome to Code Crafters Programming Club! We're excited to have you as part of our community.

Best regards,
Code Crafters Team
```

**Result for recipient "Alice Johnson":**
```
Hello Alice Johnson,

Welcome to Code Crafters Programming Club! We're excited to have you as part of our community.

Best regards,
Code Crafters Team
```

### Example 2: Event Invitation
**Subject:**
```
{{name}}, You're Invited to Our Coding Workshop!
```

**Message:**
```
Dear {{name}},

We're excited to invite you ({{reg_no}}) to our upcoming coding workshop.

Please confirm your attendance by replying to this email at {{email}}.

Looking forward to seeing you!
```

### Example 3: Reminder Email
**Message:**
```
Hi {{name}},

This is a friendly reminder about your pending task.

Your Registration Number: {{reg_no}}
Your Contact Email: {{email}}

If you have any questions, please don't hesitate to reach out.

Regards,
Admin Team
```

## How It Works

1. **Select Recipients**: Choose one or more users from the admin panel
2. **Compose Email**: Write your subject and message using placeholders
3. **Send**: Click "Send to Selected" or "Send to All"
4. **Delivery**: Each recipient receives a personalized individual email

## Technical Details

- Emails are sent in parallel for better performance
- Failed emails are logged but don't stop other emails from sending
- At least one successful email must be sent for the operation to succeed
- Each email shows the recipient's name in the "To" field

## Benefits

✅ **Privacy**: Recipients cannot see other recipients' email addresses
✅ **Personal**: Each email is addressed to the specific person
✅ **Professional**: Looks like a direct, individual communication
✅ **Flexibility**: Use placeholders or send the same message to everyone

## Note

If a user doesn't have a value for a placeholder (e.g., no registration number), the placeholder will be replaced with an empty string or "Member" for the name field.

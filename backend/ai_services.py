"""
AI Services Module
Handles ElevenLabs Conversational AI for calls and Twilio WhatsApp for messaging
"""
import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List
from elevenlabs import ElevenLabs
from twilio.rest import Client as TwilioClient
from twilio.request_validator import RequestValidator

logger = logging.getLogger(__name__)

# Environment variables
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', '+14155238886')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Initialize clients
elevenlabs_client = None
twilio_client = None
twilio_validator = None

def init_clients():
    """Initialize API clients"""
    global elevenlabs_client, twilio_client, twilio_validator
    
    if ELEVENLABS_API_KEY:
        try:
            elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
            logger.info("ElevenLabs client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ElevenLabs client: {e}")
    
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            twilio_validator = RequestValidator(TWILIO_AUTH_TOKEN)
            logger.info("Twilio client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")

# Initialize on module load
init_clients()


# ============================================
# ElevenLabs Conversational AI Functions
# ============================================

async def get_available_voices() -> List[Dict]:
    """Get list of available ElevenLabs voices"""
    if not elevenlabs_client:
        return []
    
    try:
        voices_response = elevenlabs_client.voices.get_all()
        voices = []
        for voice in voices_response.voices:
            voices.append({
                "voice_id": voice.voice_id,
                "name": voice.name,
                "category": getattr(voice, 'category', 'premade'),
                "description": getattr(voice, 'description', ''),
                "preview_url": getattr(voice, 'preview_url', None)
            })
        return voices
    except Exception as e:
        logger.error(f"Error fetching voices: {e}")
        return []


async def generate_ai_call_script(
    lead_info: Dict,
    deal_info: Optional[Dict] = None,
    knowledge_base: Optional[str] = None,
    call_purpose: str = "follow_up"
) -> str:
    """
    Generate a dynamic script/prompt for the AI agent to use during calls.
    This creates the context the AI needs to have a personalized conversation.
    """
    script = f"""You are a professional sales representative making a call on behalf of the company.

## Lead Information:
- Name: {lead_info.get('pic_name') or lead_info.get('name', 'Customer')}
- Company: {lead_info.get('company', 'their company')}
- Phone: {lead_info.get('phone', '')}
- Email: {lead_info.get('email', '')}
- Current Status: {lead_info.get('pipeline_status', lead_info.get('status', 'lead'))}
- Location: {lead_info.get('city', '')}, {lead_info.get('state', '')}, {lead_info.get('country', 'Malaysia')}
"""

    if deal_info:
        script += f"""
## Deal Information:
- Deal Name: {deal_info.get('title', 'Current Deal')}
- Deal Value: RM {deal_info.get('value', 0):,.2f}
- Deal Stage: {deal_info.get('stage', 'In Progress')}
- Expected Close Date: {deal_info.get('expected_close_date', 'TBD')}
"""

    if knowledge_base:
        script += f"""
## Product/Service Knowledge Base:
{knowledge_base}
"""

    # Add call purpose specific instructions
    purpose_instructions = {
        "follow_up": """
## Call Purpose: Follow-up
- Greet the customer warmly and introduce yourself
- Reference your previous conversation or interaction
- Ask about their current needs and how you can help
- Address any questions or concerns they might have
- If appropriate, schedule a follow-up meeting or demo
""",
        "appointment": """
## Call Purpose: Schedule Appointment
- Greet the customer and introduce yourself
- Explain the purpose of the call (to schedule a meeting/demo)
- Offer 2-3 available time slots
- Confirm the meeting details (date, time, format - virtual/in-person)
- Send a calendar invite after the call
""",
        "qualification": """
## Call Purpose: Lead Qualification
- Greet the customer professionally
- Ask about their company and role
- Understand their current challenges and pain points
- Determine their budget and timeline
- Assess decision-making authority
- Based on responses, determine if they're a qualified lead
""",
        "custom": """
## Call Purpose: Custom Script
- Follow the specific instructions provided
- Maintain a professional and helpful tone
- Listen actively and respond appropriately
"""
    }
    
    script += purpose_instructions.get(call_purpose, purpose_instructions["follow_up"])
    
    script += """
## Communication Guidelines:
- Be professional, friendly, and respectful
- Listen actively and respond to questions
- Keep responses concise and clear
- If you don't know something, offer to follow up
- End the call with clear next steps
- Thank the customer for their time
"""
    
    return script


async def initiate_ai_call(
    phone_number: str,
    lead_info: Dict,
    deal_info: Optional[Dict] = None,
    agent_config: Optional[Dict] = None,
    knowledge_base: Optional[str] = None,
    call_purpose: str = "follow_up"
) -> Dict:
    """
    Initiate an AI-powered call using ElevenLabs Conversational AI.
    
    Note: ElevenLabs Conversational AI requires a specific setup:
    1. Create a Conversational AI agent in the ElevenLabs dashboard
    2. Configure the agent with your phone number provider (Twilio)
    3. Use the agent_id to initiate calls
    
    For now, this returns the configuration needed for the call.
    The actual call initiation depends on your ElevenLabs Conversational AI setup.
    """
    if not elevenlabs_client:
        return {
            "success": False,
            "error": "ElevenLabs client not initialized. Please check API key."
        }
    
    # Generate the AI script/context
    script = await generate_ai_call_script(
        lead_info=lead_info,
        deal_info=deal_info,
        knowledge_base=knowledge_base,
        call_purpose=call_purpose
    )
    
    # Get agent configuration
    voice_id = agent_config.get('voice_id') if agent_config else None
    agent_id = agent_config.get('agent_id') if agent_config else None
    
    # Prepare call data for logging
    call_data = {
        "call_id": f"call_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{phone_number[-4:]}",
        "phone_number": phone_number,
        "lead_id": lead_info.get('id'),
        "deal_id": deal_info.get('id') if deal_info else None,
        "agent_id": agent_id,
        "voice_id": voice_id,
        "call_purpose": call_purpose,
        "script": script,
        "status": "initiated",
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "agent_name": agent_config.get('name', 'AI Agent') if agent_config else 'AI Agent'
    }
    
    # Note: ElevenLabs Conversational AI for outbound calls requires:
    # 1. A configured Conversational AI agent with phone capabilities
    # 2. Integration with a telephony provider (Twilio Voice)
    # 
    # The actual implementation would use the ElevenLabs Conversational AI SDK
    # to start a conversation session. For demo purposes, we return the call config.
    
    try:
        # In production, you would use ElevenLabs' Conversational AI API:
        # conversation = elevenlabs_client.conversational_ai.conversations.create(
        #     agent_id=agent_id,
        #     phone_number=phone_number,
        #     first_message=f"Hello, this is {agent_config.get('name', 'your AI assistant')}...",
        #     system_prompt=script
        # )
        
        return {
            "success": True,
            "call_data": call_data,
            "message": "AI call configuration prepared. Connect to ElevenLabs Conversational AI dashboard to complete setup.",
            "next_steps": [
                "1. Go to ElevenLabs Dashboard > Conversational AI",
                "2. Create or select an agent with phone capabilities",
                "3. Connect your Twilio account for outbound calling",
                "4. Use the agent_id in your CRM settings"
            ]
        }
    except Exception as e:
        logger.error(f"Error initiating AI call: {e}")
        return {
            "success": False,
            "error": str(e),
            "call_data": call_data
        }


async def get_call_transcript(call_id: str) -> Optional[Dict]:
    """Get transcript and summary of a completed AI call"""
    # This would integrate with ElevenLabs Conversational AI to get call transcripts
    # For now, return placeholder
    return {
        "call_id": call_id,
        "transcript": "Call transcript would appear here after the call is completed.",
        "summary": "Call summary generated by AI.",
        "duration": 0,
        "outcome": "pending"
    }


# ============================================
# Twilio WhatsApp Functions
# ============================================

async def send_whatsapp_message(
    recipient_phone: str,
    message_body: str,
    media_urls: Optional[List[str]] = None
) -> Dict:
    """
    Send a WhatsApp message using Twilio.
    
    Args:
        recipient_phone: Phone number in E.164 format (without + prefix)
        message_body: Text content of the message
        media_urls: Optional list of media URLs to attach
    """
    if not twilio_client:
        return {
            "success": False,
            "error": "Twilio client not initialized. Please check credentials."
        }
    
    try:
        # Format phone numbers for WhatsApp
        from_number = f"whatsapp:{TWILIO_WHATSAPP_NUMBER}"
        to_number = f"whatsapp:+{recipient_phone.lstrip('+')}"
        
        # Prepare message parameters
        message_params = {
            "from_": from_number,
            "to": to_number,
            "body": message_body
        }
        
        # Add media if provided
        if media_urls:
            message_params["media_url"] = media_urls
        
        # Send message
        message = twilio_client.messages.create(**message_params)
        
        logger.info(f"Sent WhatsApp message {message.sid} to {recipient_phone}")
        return {
            "success": True,
            "message_sid": message.sid,
            "status": message.status,
            "to": to_number,
            "body": message_body
        }
    
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {recipient_phone}: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


async def send_ai_whatsapp_message(
    recipient_phone: str,
    lead_info: Dict,
    deal_info: Optional[Dict] = None,
    message_type: str = "follow_up",
    custom_message: Optional[str] = None
) -> Dict:
    """
    Generate and send an AI-powered WhatsApp message.
    Uses the lead/deal context to create a personalized message.
    """
    if custom_message:
        message_body = custom_message
    else:
        # Generate message based on type and context
        lead_name = lead_info.get('pic_name') or lead_info.get('name', 'there')
        company = lead_info.get('company', '')
        
        if message_type == "follow_up":
            message_body = f"Hi {lead_name}! This is a follow-up from our recent conversation. "
            if deal_info:
                message_body += f"I wanted to check in about the {deal_info.get('title', 'opportunity')} we discussed. "
            message_body += "Do you have any questions I can help with? Feel free to reply anytime."
        
        elif message_type == "appointment":
            message_body = f"Hi {lead_name}! I'd love to schedule a call to discuss how we can help {company or 'your business'}. "
            message_body += "Would you be available this week for a quick 15-minute chat? Let me know what times work best for you."
        
        elif message_type == "introduction":
            message_body = f"Hi {lead_name}! I'm reaching out from {os.environ.get('COMPANY_NAME', 'our team')}. "
            message_body += f"I noticed {company or 'your company'} might benefit from our solutions. "
            message_body += "Would you be open to learning more?"
        
        elif message_type == "thank_you":
            message_body = f"Hi {lead_name}! Thank you for your time today. "
            if deal_info:
                message_body += f"I'm excited about the {deal_info.get('title', 'opportunity')} we discussed. "
            message_body += "Please don't hesitate to reach out if you have any questions!"
        
        else:
            message_body = f"Hi {lead_name}! Just checking in. How can I assist you today?"
    
    return await send_whatsapp_message(
        recipient_phone=recipient_phone,
        message_body=message_body
    )


async def generate_ai_response(
    incoming_message: str,
    lead_info: Dict,
    deal_info: Optional[Dict] = None,
    conversation_history: Optional[List[Dict]] = None
) -> str:
    """
    Generate an AI response for incoming WhatsApp messages.
    Uses LLM to create contextual responses.
    """
    # Build context for the AI
    context = f"""You are a helpful sales assistant responding to a WhatsApp message.

Customer Information:
- Name: {lead_info.get('pic_name') or lead_info.get('name', 'Customer')}
- Company: {lead_info.get('company', 'Unknown')}
- Status: {lead_info.get('pipeline_status', lead_info.get('status', 'lead'))}
"""
    
    if deal_info:
        context += f"""
Deal Information:
- Deal: {deal_info.get('title', 'Current Opportunity')}
- Value: RM {deal_info.get('value', 0):,.2f}
- Stage: {deal_info.get('stage', 'In Progress')}
"""
    
    context += """
Guidelines:
- Keep responses concise (2-3 sentences for WhatsApp)
- Be friendly and professional
- If you can't answer, offer to connect them with a human
- Use appropriate emojis sparingly
"""
    
    # For now, return a helpful placeholder
    # In production, this would call an LLM API
    return f"Thank you for your message! I'll review your inquiry and get back to you shortly. Is there anything specific I can help you with right away?"


def validate_twilio_webhook(request_url: str, params: Dict, signature: str) -> bool:
    """Validate incoming Twilio webhook signature"""
    if not twilio_validator:
        logger.warning("Twilio validator not initialized")
        return False
    
    return twilio_validator.validate(request_url, params, signature)


# ============================================
# Batch Operations
# ============================================

async def batch_ai_call(
    leads: List[Dict],
    agent_config: Dict,
    call_purpose: str = "follow_up",
    knowledge_base: Optional[str] = None
) -> Dict:
    """
    Initiate batch AI calls to multiple leads.
    Returns summary of call initiations.
    """
    results = {
        "total": len(leads),
        "successful": 0,
        "failed": 0,
        "calls": []
    }
    
    for lead in leads:
        if not lead.get('phone'):
            results["failed"] += 1
            results["calls"].append({
                "lead_id": lead.get('id'),
                "success": False,
                "error": "No phone number"
            })
            continue
        
        result = await initiate_ai_call(
            phone_number=lead['phone'],
            lead_info=lead,
            agent_config=agent_config,
            call_purpose=call_purpose,
            knowledge_base=knowledge_base
        )
        
        if result.get('success'):
            results["successful"] += 1
        else:
            results["failed"] += 1
        
        results["calls"].append({
            "lead_id": lead.get('id'),
            **result
        })
    
    return results


async def batch_whatsapp_message(
    leads: List[Dict],
    message_type: str = "follow_up",
    custom_message: Optional[str] = None
) -> Dict:
    """
    Send batch WhatsApp messages to multiple leads.
    """
    results = {
        "total": len(leads),
        "successful": 0,
        "failed": 0,
        "messages": []
    }
    
    for lead in leads:
        phone = lead.get('phone') or lead.get('office_number')
        if not phone:
            results["failed"] += 1
            results["messages"].append({
                "lead_id": lead.get('id'),
                "success": False,
                "error": "No phone number"
            })
            continue
        
        result = await send_ai_whatsapp_message(
            recipient_phone=phone,
            lead_info=lead,
            message_type=message_type,
            custom_message=custom_message
        )
        
        if result.get('success'):
            results["successful"] += 1
        else:
            results["failed"] += 1
        
        results["messages"].append({
            "lead_id": lead.get('id'),
            **result
        })
    
    return results

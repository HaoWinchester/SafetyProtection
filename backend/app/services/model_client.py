"""
LLM Model client for evaluation.

This module provides client implementations for various LLM APIs.
"""
import asyncio
import aiohttp
from typing import Optional, Dict, Any
from datetime import datetime
import json


class ModelClient:
    """
    Generic LLM model client.

    Supports multiple model types (OpenAI, Claude, local models, etc.)
    """

    def __init__(
        self,
        model_type: str,
        api_endpoint: str,
        api_key: Optional[str] = None,
        timeout_ms: int = 30000,
        max_retries: int = 3
    ):
        """
        Initialize model client.

        Args:
            model_type: Type of model (openai, claude, local, etc.)
            api_endpoint: API endpoint URL
            api_key: API key for authentication
            timeout_ms: Request timeout in milliseconds
            max_retries: Maximum number of retries
        """
        self.model_type = model_type.lower()
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.timeout = aiohttp.ClientTimeout(total=timeout_ms / 1000)
        self.max_retries = max_retries

    async def send_request(
        self,
        prompt: str,
        conversation_history: Optional[list] = None,
        model_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send request to LLM and get response.

        Args:
            prompt: User prompt to send
            conversation_history: Optional conversation history
            model_params: Optional model parameters (temperature, max_tokens, etc.)

        Returns:
            Response dict with keys:
                - success: bool
                - response: str (model's text response)
                - error: str (if failed)
                - latency_ms: float (request latency)
                - usage: dict (token usage info)
        """
        start_time = datetime.now()

        try:
            if self.model_type == "openai":
                result = await self._send_openai_request(prompt, conversation_history, model_params)
            elif self.model_type == "claude":
                result = await self._send_claude_request(prompt, conversation_history, model_params)
            elif self.model_type == "local":
                result = await self._send_local_request(prompt, conversation_history, model_params)
            else:
                result = {
                    "success": False,
                    "response": "",
                    "error": f"Unsupported model type: {self.model_type}",
                    "latency_ms": 0,
                    "usage": {}
                }

            # Calculate latency
            latency = (datetime.now() - start_time).total_seconds() * 1000
            result["latency_ms"] = latency

            return result

        except Exception as e:
            return {
                "success": False,
                "response": "",
                "error": str(e),
                "latency_ms": (datetime.now() - start_time).total_seconds() * 1000,
                "usage": {}
            }

    async def _send_openai_request(
        self,
        prompt: str,
        conversation_history: Optional[list],
        model_params: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send request to OpenAI-compatible API."""
        headers = {
            "Content-Type": "application/json"
        }

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Build messages
        messages = []

        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)

        # Add current prompt
        messages.append({"role": "user", "content": prompt})

        # Build request body
        body = {
            "model": "gpt-3.5-turbo",  # Default model
            "messages": messages,
            "temperature": model_params.get("temperature", 0.7) if model_params else 0.7,
            "max_tokens": model_params.get("max_tokens", 2000) if model_params else 2000
        }

        # Retry logic
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession(timeout=self.timeout) as session:
                    async with session.post(
                        self.api_endpoint,
                        headers=headers,
                        json=body
                    ) as response:
                        if response.status == 200:
                            data = await response.json()

                            # Extract response text
                            response_text = data["choices"][0]["message"]["content"]

                            # Extract usage info
                            usage = {
                                "prompt_tokens": data.get("usage", {}).get("prompt_tokens", 0),
                                "completion_tokens": data.get("usage", {}).get("completion_tokens", 0),
                                "total_tokens": data.get("usage", {}).get("total_tokens", 0)
                            }

                            return {
                                "success": True,
                                "response": response_text,
                                "error": None,
                                "usage": usage
                            }
                        else:
                            error_text = await response.text()
                            if attempt < self.max_retries - 1:
                                await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
                                continue

                            return {
                                "success": False,
                                "response": "",
                                "error": f"API error {response.status}: {error_text}",
                                "usage": {}
                            }

            except asyncio.TimeoutError:
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))
                    continue
                return {
                    "success": False,
                    "response": "",
                    "error": "Request timeout",
                    "usage": {}
                }
            except Exception as e:
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))
                    continue
                return {
                    "success": False,
                    "response": "",
                    "error": str(e),
                    "usage": {}
                }

        return {
            "success": False,
            "response": "",
            "error": "Max retries exceeded",
            "usage": {}
        }

    async def _send_claude_request(
        self,
        prompt: str,
        conversation_history: Optional[list],
        model_params: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send request to Claude API."""
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key or "",
            "anthropic-version": "2023-06-01"
        }

        # Build messages
        messages = []

        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": prompt})

        body = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": model_params.get("max_tokens", 2000) if model_params else 2000,
            "messages": messages
        }

        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(
                    self.api_endpoint,
                    headers=headers,
                    json=body
                ) as response:
                    if response.status == 200:
                        data = await response.json()

                        response_text = data["content"][0]["text"]
                        usage = {
                            "prompt_tokens": data.get("usage", {}).get("input_tokens", 0),
                            "completion_tokens": data.get("usage", {}).get("output_tokens", 0),
                            "total_tokens": (
                                data.get("usage", {}).get("input_tokens", 0) +
                                data.get("usage", {}).get("output_tokens", 0)
                            )
                        }

                        return {
                            "success": True,
                            "response": response_text,
                            "error": None,
                            "usage": usage
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "success": False,
                            "response": "",
                            "error": f"API error {response.status}: {error_text}",
                            "usage": {}
                        }

        except Exception as e:
            return {
                "success": False,
                "response": "",
                "error": str(e),
                "usage": {}
            }

    async def _send_local_request(
        self,
        prompt: str,
        conversation_history: Optional[list],
        model_params: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send request to local model API."""
        # Local models (e.g., Ollama, vLLM) usually use OpenAI-compatible format
        return await self._send_openai_request(prompt, conversation_history, model_params)


class MockModelClient(ModelClient):
    """
    Mock model client for testing.

    Returns simulated responses without calling real APIs.
    """

    async def send_request(
        self,
        prompt: str,
        conversation_history: Optional[list] = None,
        model_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Return mock response for testing."""
        import random

        start_time = datetime.now()

        # Simulate processing delay
        await asyncio.sleep(random.uniform(0.1, 0.5))

        # Check if prompt contains attack patterns
        prompt_lower = prompt.lower()

        if "ignore" in prompt_lower and "instruction" in prompt_lower:
            response_text = "I cannot ignore my instructions or system prompt."
            is_safe = True
        elif "system prompt" in prompt_lower:
            response_text = "I cannot reveal my system prompt or instructions."
            is_safe = True
        elif "dan" in prompt_lower or "jailbreak" in prompt_lower:
            response_text = "I cannot operate in unrestricted or jailbreak modes."
            is_safe = True
        elif "password" in prompt_lower or "secret" in prompt_lower:
            response_text = "I cannot provide passwords or sensitive information."
            is_safe = True
        else:
            # Safe response
            response_text = f"I understand your request: {prompt[:100]}..."
            is_safe = True

        latency = (datetime.now() - start_time).total_seconds() * 1000

        return {
            "success": True,
            "response": response_text,
            "error": None,
            "latency_ms": latency,
            "usage": {
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(response_text.split()),
                "total_tokens": len(prompt.split()) + len(response_text.split())
            },
            "_mock": True,
            "_is_safe_response": is_safe
        }

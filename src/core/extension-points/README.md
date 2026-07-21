# Core extension points

MVP keeps future capabilities as **IDs + contracts only**.

| ID | Package |
|----|---------|
| `ai-simplifier` | `src/future/ai-simplifier` |
| `ai-copilot` | `src/future/ai-copilot` |
| `ai-form-assistant` | `src/future/ai-form-assistant` |
| `voice-navigation` | `src/future/voice-navigation` |
| `ocr-reader` | `src/future/ocr-reader` |
| `accessibility-scanner` | `src/future/accessibility-scanner` |
| `banking-assistant` | `src/future/banking-assistant` |
| `government-website-assistant` | `src/future/government-website-assistant` |
| `page-summary` | `src/future/page-summary` |
| `cloud-sync` | `src/future/cloud-sync` |
| `user-profiles` | `src/future/user-profiles` |

Runtime registration code is added in Core steps; these packages must stay implementation-free until scheduled.

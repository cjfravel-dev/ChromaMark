"""ChromaMark markdown-it-py plugin: applies the container, inline, and critic rules."""

from .containers import container_plugin
from .critic import critic_plugin
from .inline import inline_plugin

_DEFAULTS = {
    "container": True,
    "details": True,
    "fields": True,
    "pill": True,
    "text": True,
    "meter": True,
    "critic": True,
}


def chromamark_plugin(md, **options):
    """markdown-it-py plugin: ``md.use(chromamark_plugin, **options)``."""
    opts = {**_DEFAULTS, **options}

    if opts["pill"] or opts["text"] or opts["meter"]:
        inline_plugin(md, {"pill": opts["pill"], "text": opts["text"], "meter": opts["meter"]})
    if opts["critic"]:
        critic_plugin(md)
    if opts["container"] or opts["details"] or opts["fields"]:
        container_plugin(md, {
            "callout": opts["container"],
            "details": opts["details"],
            "fields": opts["fields"],
        })
    return md

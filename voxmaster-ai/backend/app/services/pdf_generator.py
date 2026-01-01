"""
PDF Report Generator Service

Generates professional PDF reports for vocal analyses using ReportLab.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus import Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from typing import Dict, Any
from datetime import datetime


async def generate_analysis_pdf(analysis: Dict[str, Any]) -> bytes:
    """
    Generate a PDF report from an analysis result.
    
    Args:
        analysis: Analysis data dictionary
    
    Returns:
        PDF file as bytes
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
    )
    
    # Styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='Title',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#F97316'),  # Orange primary color
    ))
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#1F2937'),
    ))
    styles.add(ParagraphStyle(
        name='SubHeader',
        parent=styles['Heading3'],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=6,
        textColor=colors.HexColor('#4B5563'),
    ))
    styles.add(ParagraphStyle(
        name='Body',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
    ))
    
    # Build content
    content = []
    
    # Title
    content.append(Paragraph("VoxMaster AI", styles['Title']))
    content.append(Paragraph("Vocal Analysis Report", styles['Heading2']))
    content.append(Spacer(1, 20))
    
    # File info
    content.append(Paragraph("Analysis Information", styles['SectionHeader']))
    info_data = [
        ["Filename:", analysis.get('filename', 'Unknown')],
        ["Audio Type:", analysis.get('audio_type', 'spoken').capitalize()],
        ["Prompt Type:", analysis.get('prompt_type', 'sustained').replace('_', ' ').title()],
        ["Analyzed At:", analysis.get('created_at', datetime.now()).strftime('%Y-%m-%d %H:%M') if hasattr(analysis.get('created_at', ''), 'strftime') else str(analysis.get('created_at', ''))[:16]],
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(info_table)
    content.append(Spacer(1, 20))
    
    # Sweet Spot Score
    sweet_spot = analysis.get('sweet_spot', {})
    content.append(Paragraph("Sweet Spot Score", styles['SectionHeader']))
    
    total_score = sweet_spot.get('total', 0)
    score_color = colors.HexColor('#10B981') if total_score >= 70 else colors.HexColor('#F59E0B') if total_score >= 50 else colors.HexColor('#EF4444')
    
    score_data = [
        ["Overall Score", f"{total_score:.1f} / 100"],
    ]
    score_table = Table(score_data, colWidths=[2*inch, 2*inch])
    score_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 16),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TEXTCOLOR', (1, 0), (1, 0), score_color),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F3F4F6')),
    ]))
    content.append(score_table)
    content.append(Spacer(1, 10))
    
    # Sweet Spot components
    ss_components = [
        ["Component", "Score", "Weight"],
        ["Clarity", f"{sweet_spot.get('clarity', 0):.1f}", "25%"],
        ["Warmth", f"{sweet_spot.get('warmth', 0):.1f}", "20%"],
        ["Presence", f"{sweet_spot.get('presence', 0):.1f}", "20%"],
        ["Smoothness", f"{sweet_spot.get('smoothness', 0):.1f}", "15%"],
        ["Harshness Penalty", f"-{sweet_spot.get('harshness_penalty', 0):.1f}", "20%"],
    ]
    ss_table = Table(ss_components, colWidths=[2*inch, 1.5*inch, 1*inch])
    ss_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E5E7EB')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, -1), (0, -1), colors.HexColor('#EF4444')),
    ]))
    content.append(ss_table)
    content.append(Spacer(1, 20))
    
    # Timbre Analysis
    timbre = analysis.get('timbre', {})
    content.append(Paragraph("Timbre Analysis", styles['SectionHeader']))
    content.append(Paragraph(
        "Spectral shape and harmonic content characteristics",
        styles['Body']
    ))
    
    timbre_data = [
        ["Metric", "Score", "Description"],
        ["Brightness", f"{timbre.get('brightness', 0):.1f}", "Spectral centroid + rolloff"],
        ["Breathiness", f"{timbre.get('breathiness', 0):.1f}", "Inverse HNR + noise energy"],
        ["Warmth", f"{timbre.get('warmth', 0):.1f}", "Low harmonic strength"],
        ["Roughness", f"{timbre.get('roughness', 0):.1f}", "Jitter + shimmer"],
    ]
    timbre_table = Table(timbre_data, colWidths=[1.5*inch, 1*inch, 3*inch])
    timbre_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FEF3C7')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(timbre_table)
    content.append(Spacer(1, 20))
    
    # Vocal Weight
    weight = analysis.get('weight', {})
    content.append(Paragraph("Vocal Weight", styles['SectionHeader']))
    content.append(Paragraph(
        "Source strength and glottal closure characteristics",
        styles['Body']
    ))
    
    weight_data = [
        ["Metric", "Score", "Interpretation"],
        ["Weight", f"{weight.get('weight', 0):.1f}", 
         "Light" if weight.get('weight', 0) < 40 else "Medium" if weight.get('weight', 0) < 70 else "Heavy"],
        ["Pressed", f"{weight.get('pressed', 0):.1f}",
         "Breathy" if weight.get('pressed', 0) < 40 else "Balanced" if weight.get('pressed', 0) < 70 else "Pressed"],
    ]
    weight_table = Table(weight_data, colWidths=[1.5*inch, 1*inch, 3*inch])
    weight_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#DBEAFE')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(weight_table)
    content.append(Spacer(1, 20))
    
    # Tone Placement
    placement = analysis.get('placement', {})
    content.append(Paragraph("Tone Placement", styles['SectionHeader']))
    content.append(Paragraph(
        "Resonance patterns and energy distribution (2.5-3.5 kHz)",
        styles['Body']
    ))
    
    placement_data = [
        ["Metric", "Score", "Description"],
        ["Forwardness", f"{placement.get('forwardness', 0):.1f}", "Front/back resonance balance"],
        ["Ring Index", f"{placement.get('ring_index', 0):.1f}", "Singer's formant strength"],
        ["Nasality", f"{placement.get('nasality', 0):.1f}", "Anti-resonance detection"],
    ]
    placement_table = Table(placement_data, colWidths=[1.5*inch, 1*inch, 3*inch])
    placement_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E9D5FF')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(placement_table)
    content.append(Spacer(1, 20))
    
    # Acoustic Features
    features = analysis.get('features', {})
    content.append(Paragraph("Acoustic Features", styles['SectionHeader']))
    content.append(Paragraph(
        "Raw acoustic measurements extracted from the audio",
        styles['Body']
    ))
    
    formants = features.get('formants', {})
    features_data = [
        ["Feature", "Value", "Unit"],
        ["Spectral Centroid", f"{features.get('spectral_centroid', 0):.0f}", "Hz"],
        ["HNR", f"{features.get('hnr', 0):.1f}", "dB"],
        ["CPP", f"{features.get('cpp', 0):.1f}", "dB"],
        ["H1-H2", f"{features.get('h1_h2', 0):.1f}", "dB"],
        ["Mean F0", f"{features.get('f0_mean', 0):.0f}", "Hz"],
        ["F1", f"{formants.get('f1', 0):.0f}", "Hz"],
        ["F2", f"{formants.get('f2', 0):.0f}", "Hz"],
        ["F3", f"{formants.get('f3', 0):.0f}", "Hz"],
        ["F4", f"{formants.get('f4', 0):.0f}", "Hz"],
    ]
    features_table = Table(features_data, colWidths=[2*inch, 1.5*inch, 1*inch])
    features_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E5E7EB')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(features_table)
    content.append(Spacer(1, 30))
    
    # Footer
    content.append(Paragraph(
        f"Generated by VoxMaster AI • {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        ParagraphStyle(
            name='Footer',
            fontSize=8,
            textColor=colors.HexColor('#9CA3AF'),
            alignment=TA_CENTER,
        )
    ))
    
    # Build PDF
    doc.build(content)
    
    return buffer.getvalue()

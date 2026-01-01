"""
Reports Router - PDF Generation and Report Management
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel
import io

from app.services.database import db
from app.services.storage import storage
from app.services.pdf_generator import generate_analysis_pdf

router = APIRouter()


class ReportCreate(BaseModel):
    analysis_id: str
    format: str = "pdf"  # pdf, json, csv


class ReportResponse(BaseModel):
    id: str
    filename: str
    analysis_id: Optional[str]
    report_url: str
    report_type: str
    size_bytes: int
    created_at: str


@router.post("/", response_model=ReportResponse)
async def create_report(request: ReportCreate):
    """
    Generate a report from an analysis.
    
    Supported formats:
    - pdf: Full PDF report with visualizations
    - json: Raw analysis data as JSON
    - csv: Scores as CSV
    """
    # Get the analysis
    analysis = await db.get_analysis(request.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    try:
        if request.format == "pdf":
            # Generate PDF
            pdf_data = await generate_analysis_pdf(analysis)
            filename = f"voxmaster_analysis_{analysis['id'][:8]}.pdf"
            content_type = "application/pdf"
            report_type = "analysis"
            
        elif request.format == "json":
            # Export as JSON
            import json
            json_data = json.dumps(analysis, default=str, indent=2)
            pdf_data = json_data.encode('utf-8')
            filename = f"voxmaster_analysis_{analysis['id'][:8]}.json"
            content_type = "application/json"
            report_type = "analysis"
            
        elif request.format == "csv":
            # Export scores as CSV
            csv_lines = ["category,metric,value"]
            
            for metric, value in analysis.get('timbre', {}).items():
                csv_lines.append(f"timbre,{metric},{value}")
            for metric, value in analysis.get('weight', {}).items():
                csv_lines.append(f"weight,{metric},{value}")
            for metric, value in analysis.get('placement', {}).items():
                csv_lines.append(f"placement,{metric},{value}")
            for metric, value in analysis.get('sweet_spot', {}).items():
                csv_lines.append(f"sweet_spot,{metric},{value}")
            
            pdf_data = "\n".join(csv_lines).encode('utf-8')
            filename = f"voxmaster_analysis_{analysis['id'][:8]}.csv"
            content_type = "text/csv"
            report_type = "analysis"
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
        
        # Upload to storage
        file_id, file_url = await storage.upload_report(pdf_data, filename, content_type)
        
        # Save to database
        report = await db.create_report(
            filename=filename,
            analysis_id=request.analysis_id,
            report_url=file_url,
            report_type=report_type,
            size_bytes=len(pdf_data),
        )
        
        return ReportResponse(
            id=str(report['id']),
            filename=report['filename'],
            analysis_id=str(report['analysis_id']) if report['analysis_id'] else None,
            report_url=report['report_url'],
            report_type=report['report_type'],
            size_bytes=report['size_bytes'],
            created_at=report['created_at'].isoformat(),
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_reports(
    report_type: Optional[str] = Query(None, description="Filter by type: analysis, biometric, batch"),
    limit: int = Query(50, ge=1, le=100),
):
    """List all reports, optionally filtered by type."""
    reports = await db.list_reports(report_type=report_type, limit=limit)
    
    return {
        "reports": [
            {
                "id": str(r['id']),
                "filename": r['filename'],
                "analysis_id": str(r['analysis_id']) if r.get('analysis_id') else None,
                "audio_file": r.get('audio_file'),
                "report_type": r['report_type'],
                "size_bytes": r['size_bytes'],
                "created_at": r['created_at'].isoformat(),
            }
            for r in reports
        ]
    }


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Get report details."""
    reports = await db.list_reports(limit=100)
    report = next((r for r in reports if str(r['id']) == report_id), None)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "id": str(report['id']),
        "filename": report['filename'],
        "analysis_id": str(report['analysis_id']) if report.get('analysis_id') else None,
        "report_url": report.get('report_url'),
        "report_type": report['report_type'],
        "size_bytes": report['size_bytes'],
        "created_at": report['created_at'].isoformat(),
    }


@router.get("/{report_id}/download")
async def download_report(report_id: str):
    """Download a report file."""
    reports = await db.list_reports(limit=100)
    report = next((r for r in reports if str(r['id']) == report_id), None)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Get file from storage
    file_data = await storage.get_file(report.get('report_url', ''))
    if not file_data:
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Determine content type
    content_type = "application/octet-stream"
    filename = report['filename']
    if filename.endswith('.pdf'):
        content_type = "application/pdf"
    elif filename.endswith('.json'):
        content_type = "application/json"
    elif filename.endswith('.csv'):
        content_type = "text/csv"
    
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.delete("/{report_id}")
async def delete_report(report_id: str):
    """Delete a report."""
    reports = await db.list_reports(limit=100)
    report = next((r for r in reports if str(r['id']) == report_id), None)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Delete file from storage
    if report.get('report_url'):
        await storage.delete_file(report['report_url'])
    
    # Delete from database
    await db.delete_report(report_id)
    
    return {"deleted": report_id, "status": "success"}
